# Stripe Paywall Setup Guide

This guide will walk you through setting up the complete Stripe-based paywall system with free trial, monthly subscription, and promo codes.

## Table of Contents
1. [Stripe Account Setup](#stripe-account-setup)
2. [Create Stripe Product & Price](#create-stripe-product--price)
3. [Configure Webhooks](#configure-webhooks)
4. [Environment Variables](#environment-variables)
5. [Testing the System](#testing-the-system)
6. [Promo Code Management](#promo-code-management)
7. [Going Live](#going-live)

---

## 1. Stripe Account Setup

### Step 1: Create a Stripe Account
1. Go to [https://stripe.com](https://stripe.com)
2. Click "Sign up" and create your account
3. Complete the account verification process

### Step 2: Get Your API Keys
1. Log in to your Stripe Dashboard
2. Navigate to **Developers** → **API keys**
3. You'll see two types of keys:
   - **Publishable key** (starts with `pk_test_` for test mode)
   - **Secret key** (starts with `sk_test_` for test mode)
4. Keep these keys handy - you'll need them for environment variables

---

## 2. Create Stripe Product & Price

### Step 1: Create a Product
1. In Stripe Dashboard, go to **Products** → **Add product**
2. Fill in the details:
   - **Name**: Pro Subscription (or your preferred name)
   - **Description**: Unlimited access to all educational content features
   - **Image**: Upload your product image (optional)

### Step 2: Create a Recurring Price
1. In the same product creation form, under **Pricing**:
   - **Pricing model**: Standard pricing
   - **Price**: $9.99
   - **Billing period**: Monthly
   - **Currency**: USD
2. Click **Save product**

### Step 3: Get the Price ID
1. After creating the product, click on it to view details
2. Under **Pricing**, you'll see your price listed
3. Click on the price to see its details
4. Copy the **Price ID** (starts with `price_`)
5. Save this - you'll need it as `STRIPE_MONTHLY_PRICE_ID`

---

## 3. Configure Webhooks

Webhooks allow Stripe to notify your application about subscription events (payments, cancellations, etc.).

### Step 1: Create a Webhook Endpoint
1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your endpoint URL:
   - **Development**: `https://your-ngrok-url.ngrok.io/api/subscription/webhook`
   - **Production**: `https://yourdomain.com/api/subscription/webhook`

### Step 2: Select Events to Listen To
Select the following events:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### Step 3: Get the Webhook Secret
1. After creating the endpoint, click on it
2. Click **Reveal** under **Signing secret**
3. Copy the webhook secret (starts with `whsec_`)
4. Save this - you'll need it as `STRIPE_WEBHOOK_SECRET`

---

## 4. Environment Variables

### Backend (.env file)

Add these variables to your `backend/.env` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_MONTHLY_PRICE_ID=price_your_price_id_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Existing Firebase and other configs...
GEMINI_API_KEY=your_gemini_key
FIREBASE_PROJECT_ID=your_project_id
# ... other Firebase configs
```

### Frontend (.env file)

The frontend doesn't need Stripe keys as all Stripe operations are handled server-side for security.

---

## 5. Testing the System

### Test Mode Setup
Stripe provides test mode for safe testing without real charges.

### Step 1: Use Test Cards
Use these test card numbers:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

For all test cards:
- **Expiry**: Any future date (e.g., 12/34)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any 5 digits (e.g., 12345)

### Step 2: Test the Trial Flow
1. Sign up as a new user
2. Verify trial is initialized (7 days)
3. Check the Account menu shows "Trial Active" with days remaining
4. Try creating content - should work during trial

### Step 3: Test Trial Expiration
To test expiration without waiting 7 days:
1. Go to Firebase Console → Firestore Database
2. Find your user document in the `users` collection
3. Manually change `trial_end_date` to a past date
4. Refresh the app
5. Try creating content - should show paywall

### Step 4: Test Subscription Flow
1. Click "Subscribe Now" in the paywall
2. Use test card `4242 4242 4242 4242`
3. Complete checkout
4. Verify you're redirected back to the app
5. Check subscription status shows "Pro Subscriber"
6. Try creating content - should work

### Step 5: Test Webhooks
1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click on your webhook endpoint
3. Check the **Recent deliveries** section
4. Verify events are being received successfully (200 status)

### Step 6: Test Promo Codes
See [Promo Code Management](#promo-code-management) section below.

---

## 6. Promo Code Management

### Creating Promo Codes (Admin Only)

#### Method 1: Using API Directly
Use a tool like Postman or curl:

```bash
curl -X POST https://yourdomain.com/api/subscription/promo-codes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -d '{
    "code": "LAUNCH100",
    "description": "First 100 users - Lifetime access"
  }'
```

#### Method 2: Create Admin Panel (Recommended)
You can create a simple admin page in your app:

1. Create `frontend/src/pages/Admin.js`:
```javascript
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';

function Admin() {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');

  const handleCreatePromo = async (e) => {
    e.preventDefault();
    try {
      const token = await user.getIdToken();
      const response = await api.post('/subscription/promo-codes', {
        code,
        description
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage(`Success! Promo code ${code} created.`);
      setCode('');
      setDescription('');
    } catch (error) {
      setMessage(`Error: ${error.response?.data?.error || 'Failed to create promo code'}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Admin - Create Promo Code</h1>
      <form onSubmit={handleCreatePromo} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Promo Code</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="LAUNCH100"
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="First 100 users - Lifetime access"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          Create Promo Code
        </button>
      </form>
      {message && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          {message}
        </div>
      )}
    </div>
  );
}

export default Admin;
```

2. Add route in `AppRouter.js`:
```javascript
<Route path="/admin" element={<Admin />} />
```

3. Access at `/admin` (add authentication check in production)

### Using Promo Codes

Users can apply promo codes in the paywall modal:
1. Click "Have a promo code?"
2. Enter the code (e.g., `LAUNCH100`)
3. Click "Apply"
4. If valid and seats available, they get lifetime access immediately

### Checking Promo Code Stats

```bash
curl https://yourdomain.com/api/subscription/promo-codes/LAUNCH100 \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

Response:
```json
{
  "success": true,
  "stats": {
    "code": "LAUNCH100",
    "description": "First 100 users - Lifetime access",
    "type": "lifetime",
    "max_uses": 100,
    "used_count": 47,
    "used_by": ["user_id_1", "user_id_2", ...],
    "active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

## 7. Going Live

### Step 1: Switch to Live Mode
1. In Stripe Dashboard, toggle from **Test mode** to **Live mode** (top right)
2. Get your **live** API keys from **Developers** → **API keys**
3. Create a new **live** product and price (repeat Section 2)
4. Create a new **live** webhook endpoint (repeat Section 3)

### Step 2: Update Environment Variables
Update your production `.env` with live keys:
```bash
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_MONTHLY_PRICE_ID=price_your_live_price_id
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
```

### Step 3: Enable Customer Portal
1. In Stripe Dashboard (Live mode), go to **Settings** → **Customer portal**
2. Click **Activate test link** (or configure custom settings)
3. Enable features:
   - ✅ Cancel subscriptions
   - ✅ Update payment methods
   - ✅ View invoice history
4. Save settings

### Step 4: Configure Billing
1. Go to **Settings** → **Billing**
2. Set up your business details
3. Configure tax settings if applicable
4. Set up email receipts

### Step 5: Deploy
1. Deploy your backend with updated environment variables
2. Deploy your frontend
3. Verify webhook endpoint is accessible
4. Test with a real card (small amount)

---

## System Architecture Overview

### User Flow
```
1. User signs up → Trial initialized (7 days)
2. User creates content → Works during trial
3. Trial expires → Paywall shown
4. User subscribes → Redirected to Stripe Checkout
5. Payment succeeds → Webhook updates user status
6. User has access → Can create/download content
```

### Database Structure (Firestore)

#### Users Collection
```javascript
{
  uid: "user_id",
  email: "user@example.com",
  name: "User Name",
  trial_start_date: Timestamp,
  trial_end_date: Timestamp,
  subscription_status: "trial" | "active" | "expired" | "lifetime",
  subscription_type: "monthly" | "lifetime" | null,
  stripe_customer_id: "cus_xxx",
  stripe_subscription_id: "sub_xxx",
  promo_code_used: "LAUNCH100" | null,
  created_at: Timestamp,
  updated_at: Timestamp
}
```

#### Promo Codes Collection
```javascript
{
  code: "LAUNCH100",
  description: "First 100 users",
  type: "lifetime",
  max_uses: 100,
  used_count: 47,
  used_by: ["user_id_1", "user_id_2"],
  active: true,
  created_at: Timestamp
}
```

---

## Troubleshooting

### Webhook Not Receiving Events
- Check webhook URL is publicly accessible
- Verify webhook secret is correct
- Check Stripe Dashboard → Webhooks → Recent deliveries for errors
- Use ngrok for local testing: `ngrok http 5000`

### Subscription Not Activating
- Check webhook events are being received
- Verify `checkout.session.completed` event handler
- Check backend logs for errors
- Ensure user_id is in session metadata

### Promo Code Not Working
- Verify code exists in Firestore
- Check if max_uses limit reached
- Ensure code is active
- Check if user already used the code

### Trial Not Initializing
- Check Firebase connection
- Verify `/api/subscription/initialize-trial` endpoint
- Check browser console for errors
- Verify user authentication

---

## Security Best Practices

1. **Never expose secret keys** - Keep `STRIPE_SECRET_KEY` server-side only
2. **Validate webhooks** - Always verify webhook signatures
3. **Use HTTPS** - Stripe requires HTTPS for webhooks in production
4. **Protect admin endpoints** - Add proper authentication for promo code creation
5. **Rate limit** - Implement rate limiting on subscription endpoints
6. **Monitor logs** - Set up logging for subscription events
7. **Test thoroughly** - Use test mode extensively before going live

---

## Support Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe Testing**: https://stripe.com/docs/testing
- **Webhook Testing**: https://stripe.com/docs/webhooks/test
- **Customer Portal**: https://stripe.com/docs/billing/subscriptions/customer-portal

---

## Summary Checklist

- [ ] Stripe account created and verified
- [ ] Product and price created in Stripe
- [ ] Webhook endpoint configured
- [ ] Environment variables set in backend
- [ ] Test mode tested with test cards
- [ ] Trial flow tested
- [ ] Subscription flow tested
- [ ] Promo codes created and tested
- [ ] Webhook events verified
- [ ] Live mode configured (when ready)
- [ ] Production deployment completed

---

**Congratulations!** Your Stripe paywall system is now set up. Users will get a 7-day free trial, after which they can subscribe for $9.99/month or use a promo code for lifetime access.
