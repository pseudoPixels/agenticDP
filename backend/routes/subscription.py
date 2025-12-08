"""
Subscription Routes
Handles subscription management, checkout, and promo codes
"""

from flask import Blueprint, request, jsonify
from services.firebase_service import FirebaseService
from services.subscription_service import SubscriptionService
from functools import wraps

subscription_bp = Blueprint('subscription', __name__)

# Initialize services
firebase_service = FirebaseService()
subscription_service = SubscriptionService(firebase_service)

def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'Authentication required'}), 401
        
        user_info = firebase_service.verify_token(token)
        if not user_info:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(user_info, *args, **kwargs)
    return decorated_function

# ==================== Subscription Status ====================

@subscription_bp.route('/subscription/status', methods=['GET'])
@require_auth
def get_subscription_status(user_info):
    """Get user's subscription status"""
    try:
        user_id = user_info['uid']
        status = subscription_service.get_user_subscription_status(user_id)
        return jsonify({'success': True, 'status': status})
    except Exception as e:
        print(f"Error getting subscription status: {e}")
        return jsonify({'error': str(e)}), 500

@subscription_bp.route('/subscription/initialize-trial', methods=['POST'])
@require_auth
def initialize_trial(user_info):
    """Initialize trial for user (called on first login)"""
    try:
        user_id = user_info['uid']
        trial_data = subscription_service.initialize_user_trial(user_id)
        return jsonify({'success': True, 'trial': trial_data})
    except Exception as e:
        print(f"Error initializing trial: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== Stripe Checkout ====================

@subscription_bp.route('/subscription/create-checkout-session', methods=['POST'])
@require_auth
def create_checkout_session(user_info):
    """Create Stripe checkout session for subscription"""
    try:
        data = request.json
        success_url = data.get('success_url')
        cancel_url = data.get('cancel_url')
        
        if not success_url or not cancel_url:
            return jsonify({'error': 'success_url and cancel_url are required'}), 400
        
        user_id = user_info['uid']
        user_email = user_info.get('email')
        
        checkout_url = subscription_service.create_checkout_session(
            user_id, user_email, success_url, cancel_url
        )
        
        return jsonify({'success': True, 'checkout_url': checkout_url})
    except Exception as e:
        print(f"Error creating checkout session: {e}")
        return jsonify({'error': str(e)}), 500

@subscription_bp.route('/subscription/create-portal-session', methods=['POST'])
@require_auth
def create_portal_session(user_info):
    """Create Stripe customer portal session"""
    try:
        data = request.json
        return_url = data.get('return_url')
        
        if not return_url:
            return jsonify({'error': 'return_url is required'}), 400
        
        user_id = user_info['uid']
        portal_url = subscription_service.create_portal_session(user_id, return_url)
        
        return jsonify({'success': True, 'portal_url': portal_url})
    except Exception as e:
        print(f"Error creating portal session: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== Stripe Webhook ====================

@subscription_bp.route('/subscription/webhook', methods=['POST'])
def stripe_webhook():
    """Handle Stripe webhook events"""
    try:
        payload = request.data
        sig_header = request.headers.get('Stripe-Signature')
        
        if not sig_header:
            return jsonify({'error': 'Missing signature'}), 400
        
        result = subscription_service.handle_webhook(payload, sig_header)
        return jsonify(result)
    except Exception as e:
        print(f"Webhook error: {e}")
        return jsonify({'error': str(e)}), 400

# ==================== Promo Codes ====================

@subscription_bp.route('/subscription/apply-promo-code', methods=['POST'])
@require_auth
def apply_promo_code(user_info):
    """Apply promo code to user account"""
    try:
        data = request.json
        code = data.get('code')
        
        if not code:
            return jsonify({'error': 'Promo code is required'}), 400
        
        user_id = user_info['uid']
        result = subscription_service.validate_and_apply_promo_code(user_id, code)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
    except Exception as e:
        print(f"Error applying promo code: {e}")
        return jsonify({'error': str(e)}), 500

@subscription_bp.route('/subscription/promo-codes', methods=['GET'])
@require_auth
def list_promo_codes(user_info):
    """List all promo codes (admin only)"""
    try:
        # TODO: Add admin check
        promo_codes = subscription_service.list_promo_codes()
        return jsonify({'success': True, 'promo_codes': promo_codes})
    except Exception as e:
        print(f"Error listing promo codes: {e}")
        return jsonify({'error': str(e)}), 500

@subscription_bp.route('/subscription/promo-codes', methods=['POST'])
@require_auth
def create_promo_code(user_info):
    """Create a new promo code (admin only)"""
    try:
        # TODO: Add admin check
        data = request.json
        code = data.get('code')
        description = data.get('description', '')
        
        if not code:
            return jsonify({'error': 'Promo code is required'}), 400
        
        promo_data = subscription_service.create_promo_code(code, description)
        return jsonify({'success': True, 'promo_code': promo_data})
    except Exception as e:
        print(f"Error creating promo code: {e}")
        return jsonify({'error': str(e)}), 500

@subscription_bp.route('/subscription/promo-codes/<code>', methods=['GET'])
@require_auth
def get_promo_code_stats(user_info, code):
    """Get promo code statistics (admin only)"""
    try:
        # TODO: Add admin check
        stats = subscription_service.get_promo_code_stats(code)
        if stats:
            return jsonify({'success': True, 'stats': stats})
        else:
            return jsonify({'error': 'Promo code not found'}), 404
    except Exception as e:
        print(f"Error getting promo code stats: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== Subscription Check Utility ====================

def check_subscription_access(user_id: str) -> tuple[bool, dict]:
    """
    Utility function to check if user has access to create/download content
    Returns: (has_access: bool, status_info: dict)
    """
    try:
        status = subscription_service.get_user_subscription_status(user_id)
        return status.get('can_create_content', False), status
    except Exception as e:
        print(f"Error checking subscription access: {e}")
        return False, {'error': str(e)}
