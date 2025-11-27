"""
Student Management Routes
Handles CRUD operations for students
"""

from flask import Blueprint, request, jsonify
from services.firebase_service import firebase_service
from functools import wraps

students_bp = Blueprint('students', __name__)

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
        
        request.user = user_info
        return f(*args, **kwargs)
    
    return decorated_function


@students_bp.route('/students', methods=['POST'])
@require_auth
def add_student():
    """Add a new student"""
    data = request.json
    
    # Validate required fields
    if 'name' not in data:
        return jsonify({'error': 'Student name is required'}), 400
    
    try:
        student_id = firebase_service.add_student(request.user['uid'], data)
        return jsonify({
            'success': True,
            'student_id': student_id,
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@students_bp.route('/students/<student_id>', methods=['GET'])
@require_auth
def get_student(student_id):
    """Get a specific student"""
    student = firebase_service.get_student(student_id)
    
    if not student:
        return jsonify({'error': 'Student not found'}), 404
    
    # Check if user owns the student
    if student['user_id'] != request.user['uid']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    return jsonify({
        'success': True,
        'student': student
    })


@students_bp.route('/students/<student_id>', methods=['PUT'])
@require_auth
def update_student(student_id):
    """Update a student"""
    data = request.json
    
    # Get student to check ownership
    student = firebase_service.get_student(student_id)
    if not student:
        return jsonify({'error': 'Student not found'}), 404
    
    if student['user_id'] != request.user['uid']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Remove fields that shouldn't be updated
    data.pop('id', None)
    data.pop('user_id', None)
    data.pop('created_at', None)
    
    success = firebase_service.update_student(student_id, data)
    
    if success:
        return jsonify({
            'success': True,
            'message': 'Student updated successfully'
        })
    else:
        return jsonify({'error': 'Failed to update student'}), 500


@students_bp.route('/students/<student_id>', methods=['DELETE'])
@require_auth
def delete_student(student_id):
    """Delete a student"""
    # Get student to check ownership
    student = firebase_service.get_student(student_id)
    if not student:
        return jsonify({'error': 'Student not found'}), 404
    
    if student['user_id'] != request.user['uid']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    success = firebase_service.delete_student(student_id)
    
    if success:
        return jsonify({
            'success': True,
            'message': 'Student deleted successfully'
        })
    else:
        return jsonify({'error': 'Failed to delete student'}), 500


@students_bp.route('/students', methods=['GET'])
@require_auth
def get_user_students():
    """Get all students for the authenticated user"""
    students = firebase_service.get_user_students(request.user['uid'])
    
    return jsonify({
        'success': True,
        'students': students,
        'count': len(students)
    })


@students_bp.route('/students/<student_id>/resources', methods=['GET'])
@require_auth
def get_student_resources(student_id):
    """Get all resources assigned to a student"""
    # Check student ownership
    student = firebase_service.get_student(student_id)
    if not student or student['user_id'] != request.user['uid']:
        return jsonify({'error': 'Student not found'}), 404
    
    resources = firebase_service.get_student_resources(student_id)
    
    return jsonify({
        'success': True,
        'resources': resources,
        'count': len(resources)
    })
