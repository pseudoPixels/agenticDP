"""
Resource Management Routes
Handles CRUD operations for lessons, worksheets, and other educational resources
"""

from flask import Blueprint, request, jsonify
from services.firebase_service import firebase_service
from functools import wraps

resources_bp = Blueprint('resources', __name__)

def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'No authorization token provided'}), 401
        
        token = auth_header.split('Bearer ')[1]
        user_info = firebase_service.verify_token(token)
        
        if not user_info:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Add user info to request context
        request.user = user_info
        return f(*args, **kwargs)
    
    return decorated_function


@resources_bp.route('/auth/verify', methods=['POST'])
def verify_auth():
    """Verify authentication token and get/create user"""
    data = request.json
    token = data.get('token')
    
    if not token:
        return jsonify({'error': 'Token required'}), 400
    
    user_info = firebase_service.verify_token(token)
    if not user_info:
        return jsonify({'error': 'Invalid token'}), 401
    
    # Get or create user in Firestore
    user_data = firebase_service.get_or_create_user(user_info)
    
    return jsonify({
        'success': True,
        'user': user_data
    })


@resources_bp.route('/resources', methods=['POST'])
@require_auth
def save_resource():
    """Save a new resource"""
    data = request.json
    
    # Validate required fields
    required_fields = ['resource_type', 'title', 'content']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Valid resource types
    valid_types = ['lesson', 'worksheet', 'presentation', 'curriculum', 'flashcard', 'quiz']
    if data['resource_type'] not in valid_types:
        return jsonify({'error': 'Invalid resource type'}), 400
    
    try:
        resource_id = firebase_service.save_resource(request.user['uid'], data)
        return jsonify({
            'success': True,
            'resource_id': resource_id,
            'message': 'Resource saved successfully'
        })
    except Exception as e:
        print(f"Error saving resource: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@resources_bp.route('/resources/<resource_id>', methods=['GET'])
@require_auth
def get_resource(resource_id):
    """Get a specific resource"""
    resource = firebase_service.get_resource(resource_id)
    
    if not resource:
        return jsonify({'error': 'Resource not found'}), 404
    
    # Check if user owns the resource
    if resource['user_id'] != request.user['uid']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    return jsonify({
        'success': True,
        'resource': resource
    })


@resources_bp.route('/resources/<resource_id>', methods=['PUT'])
@require_auth
def update_resource(resource_id):
    """Update a resource"""
    data = request.json
    
    # Get resource to check ownership
    resource = firebase_service.get_resource(resource_id)
    if not resource:
        return jsonify({'error': 'Resource not found'}), 404
    
    if resource['user_id'] != request.user['uid']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Remove fields that shouldn't be updated
    data.pop('id', None)
    data.pop('user_id', None)
    data.pop('created_at', None)
    
    success = firebase_service.update_resource(resource_id, data)
    
    if success:
        return jsonify({
            'success': True,
            'message': 'Resource updated successfully'
        })
    else:
        return jsonify({'error': 'Failed to update resource'}), 500


@resources_bp.route('/resources/<resource_id>', methods=['DELETE'])
@require_auth
def delete_resource(resource_id):
    """Delete a resource"""
    # Get resource to check ownership
    resource = firebase_service.get_resource(resource_id)
    if not resource:
        return jsonify({'error': 'Resource not found'}), 404
    
    if resource['user_id'] != request.user['uid']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    success = firebase_service.delete_resource(resource_id)
    
    if success:
        return jsonify({
            'success': True,
            'message': 'Resource deleted successfully'
        })
    else:
        return jsonify({'error': 'Failed to delete resource'}), 500


@resources_bp.route('/resources', methods=['GET'])
@require_auth
def get_user_resources():
    """Get all resources for the authenticated user"""
    resource_type = request.args.get('type')
    limit = int(request.args.get('limit', 50))
    offset = int(request.args.get('offset', 0))
    
    resources = firebase_service.get_user_resources(
        request.user['uid'],
        resource_type=resource_type,
        limit=limit,
        offset=offset
    )
    
    return jsonify({
        'success': True,
        'resources': resources,
        'count': len(resources)
    })


@resources_bp.route('/resources/<resource_id>/assign', methods=['POST'])
@require_auth
def assign_resource(resource_id):
    """Assign a resource to a student"""
    data = request.json
    student_id = data.get('student_id')
    
    if not student_id:
        return jsonify({'error': 'Student ID required'}), 400
    
    # Check resource ownership
    resource = firebase_service.get_resource(resource_id)
    if not resource:
        return jsonify({'error': 'Resource not found'}), 404
    
    if resource['user_id'] != request.user['uid']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Check student ownership
    student = firebase_service.get_student(student_id)
    if not student or student['user_id'] != request.user['uid']:
        return jsonify({'error': 'Student not found'}), 404
    
    success = firebase_service.assign_resource_to_student(resource_id, student_id)
    
    if success:
        return jsonify({
            'success': True,
            'message': 'Resource assigned successfully'
        })
    else:
        return jsonify({'error': 'Failed to assign resource'}), 500


@resources_bp.route('/resources/<resource_id>/unassign', methods=['POST'])
@require_auth
def unassign_resource(resource_id):
    """Remove a resource assignment from a student"""
    data = request.json
    student_id = data.get('student_id')
    
    if not student_id:
        return jsonify({'error': 'Student ID required'}), 400
    
    # Check resource ownership
    resource = firebase_service.get_resource(resource_id)
    if not resource:
        return jsonify({'error': 'Resource not found'}), 404
    
    if resource['user_id'] != request.user['uid']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    success = firebase_service.unassign_resource_from_student(resource_id, student_id)
    
    if success:
        return jsonify({
            'success': True,
            'message': 'Resource unassigned successfully'
        })
    else:
        return jsonify({'error': 'Failed to unassign resource'}), 500
