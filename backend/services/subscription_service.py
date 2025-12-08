"""
Subscription Service for Stripe Integration
Handles subscription management, promo codes, and trial tracking
"""

import stripe
import os
from datetime import datetime, timedelta
from typing import Dict, Optional, List
from firebase_admin import firestore

class SubscriptionService:
    def __init__(self, firebase_service):
        """Initialize Stripe with API key"""
        self.firebase_service = firebase_service
        self.stripe_secret_key = os.getenv('STRIPE_SECRET_KEY')
        self.monthly_price_id = os.getenv('STRIPE_MONTHLY_PRICE_ID')
        self.webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
        
        self.stripe_enabled = all([self.stripe_secret_key, self.monthly_price_id, self.webhook_secret])
        
        if not self.stripe_enabled:
            print("⚠️  Stripe not configured - payment features disabled (trial tracking still works)")
        else:
            stripe.api_key = self.stripe_secret_key
            print("✓ Stripe initialized successfully")
        
        self.db = firebase_service.db
        
        # Subscription settings
        self.TRIAL_DAYS = 7
        self.MONTHLY_PRICE = 9.99  # USD
        self.PROMO_CODE_LIMIT = 100
    
    # ==================== Trial Management ====================
    
    def initialize_user_trial(self, user_id: str) -> Dict:
        """
        Initialize trial for a new user
        Returns user subscription data
        """
        if not self.firebase_service.enabled:
            return {}
        
        try:
            user_ref = self.db.collection('users').document(user_id)
            user_doc = user_ref.get()
            
            if user_doc.exists:
                user_data = user_doc.to_dict()
                
                # Check if trial already initialized
                if 'trial_start_date' not in user_data:
                    # Initialize trial
                    trial_start = datetime.utcnow()
                    trial_end = trial_start + timedelta(days=self.TRIAL_DAYS)
                    
                    user_ref.update({
                        'trial_start_date': trial_start,
                        'trial_end_date': trial_end,
                        'subscription_status': 'trial',
                        'subscription_type': None,
                        'stripe_customer_id': None,
                        'stripe_subscription_id': None,
                        'promo_code_used': None,
                        'updated_at': datetime.utcnow()
                    })
                    
                    print(f"✓ Trial initialized for user {user_id}")
                    return {
                        'trial_start_date': trial_start,
                        'trial_end_date': trial_end,
                        'subscription_status': 'trial',
                        'days_remaining': self.TRIAL_DAYS
                    }
                else:
                    # Return existing trial data
                    return self._get_subscription_status(user_data)
            
            return {}
        except Exception as e:
            print(f"Error initializing trial: {e}")
            return {}
    
    def get_user_subscription_status(self, user_id: str) -> Dict:
        """
        Get user's subscription status including trial info
        Returns: {
            'subscription_status': 'trial'|'active'|'expired'|'lifetime',
            'days_remaining': int (for trial),
            'trial_end_date': datetime,
            'subscription_type': 'monthly'|'lifetime'|None,
            'can_create_content': bool
        }
        """
        if not self.firebase_service.enabled:
            return {'subscription_status': 'active', 'can_create_content': True}
        
        try:
            user_ref = self.db.collection('users').document(user_id)
            user_doc = user_ref.get()
            
            if user_doc.exists:
                user_data = user_doc.to_dict()
                return self._get_subscription_status(user_data)
            
            return {'subscription_status': 'expired', 'can_create_content': False}
        except Exception as e:
            print(f"Error getting subscription status: {e}")
            return {'subscription_status': 'expired', 'can_create_content': False}
    
    def _get_subscription_status(self, user_data: Dict) -> Dict:
        """Internal method to calculate subscription status from user data"""
        now = datetime.utcnow()
        
        # Check for lifetime subscription (promo code)
        if user_data.get('subscription_type') == 'lifetime':
            return {
                'subscription_status': 'lifetime',
                'subscription_type': 'lifetime',
                'can_create_content': True,
                'promo_code_used': user_data.get('promo_code_used')
            }
        
        # Check for active paid subscription
        if user_data.get('subscription_status') == 'active':
            return {
                'subscription_status': 'active',
                'subscription_type': 'monthly',
                'can_create_content': True,
                'stripe_subscription_id': user_data.get('stripe_subscription_id')
            }
        
        # Check trial status
        trial_end = user_data.get('trial_end_date')
        if trial_end:
            # Convert Firestore timestamp to datetime if needed
            if hasattr(trial_end, 'timestamp'):
                trial_end = datetime.fromtimestamp(trial_end.timestamp())
            
            if now < trial_end:
                days_remaining = (trial_end - now).days
                return {
                    'subscription_status': 'trial',
                    'trial_end_date': trial_end,
                    'days_remaining': max(0, days_remaining),
                    'can_create_content': True
                }
        
        # Trial expired or no subscription
        return {
            'subscription_status': 'expired',
            'can_create_content': False,
            'trial_end_date': trial_end
        }
    
    # ==================== Stripe Checkout ====================
    
    def create_checkout_session(self, user_id: str, user_email: str, 
                                success_url: str, cancel_url: str) -> Optional[str]:
        """
        Create a Stripe Checkout session for monthly subscription
        Returns checkout session URL
        """
        if not self.stripe_enabled:
            raise Exception("Stripe is not configured")
        
        try:
            # Get or create Stripe customer
            customer_id = self._get_or_create_customer(user_id, user_email)
            
            # Get price ID from environment
            price_id = os.getenv('STRIPE_MONTHLY_PRICE_ID')
            if not price_id:
                raise Exception("STRIPE_MONTHLY_PRICE_ID not configured")
            
            # Create checkout session
            session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=['card'],
                line_items=[{
                    'price': price_id,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    'user_id': user_id
                },
                subscription_data={
                    'metadata': {
                        'user_id': user_id
                    }
                }
            )
            
            print(f"✓ Checkout session created for user {user_id}")
            return session.url
        except Exception as e:
            print(f"Error creating checkout session: {e}")
            raise
    
    def _get_or_create_customer(self, user_id: str, user_email: str) -> str:
        """Get or create Stripe customer for user"""
        # Check if user already has a customer ID
        user_ref = self.db.collection('users').document(user_id)
        user_doc = user_ref.get()
        
        if user_doc.exists:
            user_data = user_doc.to_dict()
            customer_id = user_data.get('stripe_customer_id')
            
            if customer_id:
                # Verify customer exists in Stripe
                try:
                    stripe.Customer.retrieve(customer_id)
                    return customer_id
                except:
                    pass
        
        # Create new customer
        customer = stripe.Customer.create(
            email=user_email,
            metadata={'user_id': user_id}
        )
        
        # Save customer ID
        user_ref.update({
            'stripe_customer_id': customer.id,
            'updated_at': datetime.utcnow()
        })
        
        return customer.id
    
    def create_portal_session(self, user_id: str, return_url: str) -> Optional[str]:
        """
        Create a Stripe Customer Portal session for subscription management
        Returns portal session URL
        """
        if not self.stripe_enabled:
            raise Exception("Stripe is not configured")
        
        try:
            user_ref = self.db.collection('users').document(user_id)
            user_doc = user_ref.get()
            
            if not user_doc.exists:
                raise Exception("User not found")
            
            user_data = user_doc.to_dict()
            customer_id = user_data.get('stripe_customer_id')
            
            if not customer_id:
                raise Exception("No Stripe customer found")
            
            # Create portal session
            session = stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url=return_url
            )
            
            return session.url
        except Exception as e:
            print(f"Error creating portal session: {e}")
            raise
    
    # ==================== Webhook Handling ====================
    
    def handle_webhook(self, payload: bytes, sig_header: str) -> Dict:
        """
        Handle Stripe webhook events
        Returns event data
        """
        if not self.stripe_enabled:
            raise Exception("Stripe is not configured")
        
        webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
        if not webhook_secret:
            raise Exception("STRIPE_WEBHOOK_SECRET not configured")
        
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
        except ValueError as e:
            raise Exception(f"Invalid payload: {e}")
        except stripe.error.SignatureVerificationError as e:
            raise Exception(f"Invalid signature: {e}")
        
        # Handle the event
        event_type = event['type']
        data = event['data']['object']
        
        print(f"Processing webhook event: {event_type}")
        
        if event_type == 'checkout.session.completed':
            self._handle_checkout_completed(data)
        elif event_type == 'customer.subscription.updated':
            self._handle_subscription_updated(data)
        elif event_type == 'customer.subscription.deleted':
            self._handle_subscription_deleted(data)
        elif event_type == 'invoice.payment_succeeded':
            self._handle_payment_succeeded(data)
        elif event_type == 'invoice.payment_failed':
            self._handle_payment_failed(data)
        
        return {'status': 'success', 'event_type': event_type}
    
    def _handle_checkout_completed(self, session):
        """Handle successful checkout"""
        user_id = session['metadata'].get('user_id')
        if not user_id:
            print("Warning: No user_id in checkout session metadata")
            return
        
        subscription_id = session.get('subscription')
        customer_id = session.get('customer')
        
        # Update user subscription status
        user_ref = self.db.collection('users').document(user_id)
        user_ref.update({
            'subscription_status': 'active',
            'subscription_type': 'monthly',
            'stripe_customer_id': customer_id,
            'stripe_subscription_id': subscription_id,
            'subscription_start_date': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        })
        
        print(f"✓ Subscription activated for user {user_id}")
    
    def _handle_subscription_updated(self, subscription):
        """Handle subscription update"""
        user_id = subscription['metadata'].get('user_id')
        if not user_id:
            # Try to find user by customer ID
            customer_id = subscription.get('customer')
            user_id = self._find_user_by_customer_id(customer_id)
        
        if not user_id:
            print("Warning: Could not find user for subscription update")
            return
        
        status = subscription['status']
        
        # Map Stripe status to our status
        if status in ['active', 'trialing']:
            subscription_status = 'active'
        elif status in ['past_due', 'unpaid']:
            subscription_status = 'past_due'
        else:
            subscription_status = 'inactive'
        
        user_ref = self.db.collection('users').document(user_id)
        user_ref.update({
            'subscription_status': subscription_status,
            'updated_at': datetime.utcnow()
        })
        
        print(f"✓ Subscription updated for user {user_id}: {subscription_status}")
    
    def _handle_subscription_deleted(self, subscription):
        """Handle subscription cancellation"""
        user_id = subscription['metadata'].get('user_id')
        if not user_id:
            customer_id = subscription.get('customer')
            user_id = self._find_user_by_customer_id(customer_id)
        
        if not user_id:
            print("Warning: Could not find user for subscription deletion")
            return
        
        user_ref = self.db.collection('users').document(user_id)
        user_ref.update({
            'subscription_status': 'expired',
            'subscription_end_date': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        })
        
        print(f"✓ Subscription cancelled for user {user_id}")
    
    def _handle_payment_succeeded(self, invoice):
        """Handle successful payment"""
        subscription_id = invoice.get('subscription')
        if subscription_id:
            print(f"✓ Payment succeeded for subscription {subscription_id}")
    
    def _handle_payment_failed(self, invoice):
        """Handle failed payment"""
        customer_id = invoice.get('customer')
        user_id = self._find_user_by_customer_id(customer_id)
        
        if user_id:
            user_ref = self.db.collection('users').document(user_id)
            user_ref.update({
                'subscription_status': 'past_due',
                'updated_at': datetime.utcnow()
            })
            print(f"⚠️  Payment failed for user {user_id}")
    
    def _find_user_by_customer_id(self, customer_id: str) -> Optional[str]:
        """Find user ID by Stripe customer ID"""
        try:
            query = self.db.collection('users').where('stripe_customer_id', '==', customer_id).limit(1)
            docs = list(query.stream())
            if docs:
                return docs[0].id
        except Exception as e:
            print(f"Error finding user by customer ID: {e}")
        return None
    
    # ==================== Promo Code Management ====================
    
    def create_promo_code(self, code: str, description: str = "") -> Dict:
        """
        Create a lifetime promo code (admin only)
        Returns promo code data
        """
        if not self.firebase_service.enabled:
            raise Exception("Firebase is not enabled")
        
        try:
            # Check if code already exists
            promo_ref = self.db.collection('promo_codes').document(code.upper())
            promo_doc = promo_ref.get()
            
            if promo_doc.exists:
                raise Exception("Promo code already exists")
            
            # Create promo code
            promo_data = {
                'code': code.upper(),
                'description': description,
                'type': 'lifetime',
                'max_uses': self.PROMO_CODE_LIMIT,
                'used_count': 0,
                'used_by': [],
                'created_at': datetime.utcnow(),
                'active': True
            }
            
            promo_ref.set(promo_data)
            print(f"✓ Promo code created: {code}")
            return promo_data
        except Exception as e:
            print(f"Error creating promo code: {e}")
            raise
    
    def validate_and_apply_promo_code(self, user_id: str, code: str) -> Dict:
        """
        Validate and apply promo code to user
        Returns result with success status
        """
        if not self.firebase_service.enabled:
            raise Exception("Firebase is not enabled")
        
        try:
            # Get promo code
            promo_ref = self.db.collection('promo_codes').document(code.upper())
            promo_doc = promo_ref.get()
            
            if not promo_doc.exists:
                return {'success': False, 'error': 'Invalid promo code'}
            
            promo_data = promo_doc.to_dict()
            
            # Check if active
            if not promo_data.get('active'):
                return {'success': False, 'error': 'Promo code is no longer active'}
            
            # Check if limit reached
            if promo_data.get('used_count', 0) >= promo_data.get('max_uses', 0):
                return {'success': False, 'error': 'Promo code limit reached'}
            
            # Check if user already used it
            if user_id in promo_data.get('used_by', []):
                return {'success': False, 'error': 'You have already used this promo code'}
            
            # Check if user already has a subscription
            user_ref = self.db.collection('users').document(user_id)
            user_doc = user_ref.get()
            
            if user_doc.exists:
                user_data = user_doc.to_dict()
                if user_data.get('subscription_type') in ['monthly', 'lifetime']:
                    return {'success': False, 'error': 'You already have an active subscription'}
            
            # Apply promo code - use transaction to prevent race conditions
            @firestore.transactional
            def apply_code(transaction):
                # Re-read promo code in transaction
                promo_snapshot = promo_ref.get(transaction=transaction)
                promo_data = promo_snapshot.to_dict()
                
                # Double-check limit
                if promo_data.get('used_count', 0) >= promo_data.get('max_uses', 0):
                    raise Exception('Promo code limit reached')
                
                # Update user
                transaction.update(user_ref, {
                    'subscription_status': 'lifetime',
                    'subscription_type': 'lifetime',
                    'promo_code_used': code.upper(),
                    'subscription_start_date': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                })
                
                # Update promo code
                transaction.update(promo_ref, {
                    'used_count': firestore.Increment(1),
                    'used_by': firestore.ArrayUnion([user_id])
                })
            
            # Execute transaction
            transaction = self.db.transaction()
            apply_code(transaction)
            
            print(f"✓ Promo code {code} applied to user {user_id}")
            return {
                'success': True,
                'message': 'Lifetime access granted!',
                'subscription_type': 'lifetime'
            }
        except Exception as e:
            print(f"Error applying promo code: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_promo_code_stats(self, code: str) -> Optional[Dict]:
        """Get promo code usage statistics (admin only)"""
        if not self.firebase_service.enabled:
            return None
        
        try:
            promo_ref = self.db.collection('promo_codes').document(code.upper())
            promo_doc = promo_ref.get()
            
            if promo_doc.exists:
                return promo_doc.to_dict()
            return None
        except Exception as e:
            print(f"Error getting promo code stats: {e}")
            return None
    
    def list_promo_codes(self) -> List[Dict]:
        """List all promo codes (admin only)"""
        if not self.firebase_service.enabled:
            return []
        
        try:
            query = self.db.collection('promo_codes').order_by('created_at', direction=firestore.Query.DESCENDING)
            docs = query.stream()
            return [doc.to_dict() for doc in docs]
        except Exception as e:
            print(f"Error listing promo codes: {e}")
            return []
