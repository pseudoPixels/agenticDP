#!/usr/bin/env python3
"""
Test Stripe checkout session creation
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

# Add backend to path
sys.path.insert(0, 'backend')

import stripe

def test_stripe_connection():
    """Test basic Stripe connection"""
    print("=" * 60)
    print("Testing Stripe Configuration")
    print("=" * 60)
    
    # Get environment variables
    secret_key = os.getenv('STRIPE_SECRET_KEY')
    price_id = os.getenv('STRIPE_MONTHLY_PRICE_ID')
    webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
    
    print(f"\n1. Environment Variables:")
    print(f"   STRIPE_SECRET_KEY: {'✓ Set' if secret_key else '✗ Missing'}")
    print(f"   STRIPE_MONTHLY_PRICE_ID: {price_id if price_id else '✗ Missing'}")
    print(f"   STRIPE_WEBHOOK_SECRET: {'✓ Set' if webhook_secret else '✗ Missing'}")
    
    if not all([secret_key, price_id, webhook_secret]):
        print("\n❌ Missing required environment variables!")
        return False
    
    # Set Stripe API key
    stripe.api_key = secret_key
    
    # Test 1: Verify API key works
    print(f"\n2. Testing Stripe API Connection...")
    try:
        balance = stripe.Balance.retrieve()
        print(f"   ✓ Connected to Stripe successfully")
        print(f"   Mode: {'TEST' if 'test' in secret_key else 'LIVE'}")
    except stripe.error.AuthenticationError as e:
        print(f"   ✗ Authentication failed: {e}")
        return False
    except Exception as e:
        print(f"   ✗ Error: {e}")
        return False
    
    # Test 2: Verify price exists
    print(f"\n3. Testing Price ID...")
    try:
        price = stripe.Price.retrieve(price_id)
        print(f"   ✓ Price found: {price.id}")
        print(f"   Amount: ${price.unit_amount / 100:.2f} {price.currency.upper()}")
        print(f"   Recurring: {price.recurring.interval if price.recurring else 'N/A'}")
        print(f"   Product: {price.product}")
    except stripe.error.InvalidRequestError as e:
        print(f"   ✗ Price not found: {e}")
        return False
    except Exception as e:
        print(f"   ✗ Error: {e}")
        return False
    
    # Test 3: Create a test customer
    print(f"\n4. Creating Test Customer...")
    try:
        customer = stripe.Customer.create(
            email="test@example.com",
            metadata={'test': 'true'}
        )
        print(f"   ✓ Customer created: {customer.id}")
    except Exception as e:
        print(f"   ✗ Error creating customer: {e}")
        return False
    
    # Test 4: Create checkout session
    print(f"\n5. Creating Test Checkout Session...")
    try:
        session = stripe.checkout.Session.create(
            customer=customer.id,
            payment_method_types=['card'],
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            mode='subscription',
            success_url='https://example.com/success',
            cancel_url='https://example.com/cancel',
            metadata={'test': 'true'}
        )
        print(f"   ✓ Checkout session created: {session.id}")
        print(f"   URL: {session.url}")
    except stripe.error.InvalidRequestError as e:
        print(f"   ✗ Invalid request: {e}")
        print(f"   Error type: {type(e).__name__}")
        return False
    except Exception as e:
        print(f"   ✗ Error creating session: {e}")
        print(f"   Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return False
    
    # Cleanup
    print(f"\n6. Cleaning up test data...")
    try:
        stripe.Customer.delete(customer.id)
        print(f"   ✓ Test customer deleted")
    except:
        pass
    
    print("\n" + "=" * 60)
    print("✅ All tests passed! Stripe is configured correctly.")
    print("=" * 60)
    return True

if __name__ == '__main__':
    success = test_stripe_connection()
    sys.exit(0 if success else 1)
