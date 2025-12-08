# Quick Start Guide - Stripe Paywall

## 🚀 Get Started in 5 Steps

### Step 1: Install Dependencies
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### Step 2: Create Stripe Account & Product
1. Sign up at [stripe.com](https://stripe.com)
2. Go to **Products** → Create a product
3. Set price: **$9.99/month** (recurring)
4. Copy the **Price ID** (starts with `price_`)

### Step 3: Set Up Webhook
1. Go to **Developers** → **Webhooks** → **Add endpoint**
2. URL: `https://your-domain.com/api/subscription/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the **Webhook Secret** (starts with `whsec_`)

### Step 4: Configure Environment Variables
Add to `backend/.env`:
```bash
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_MONTHLY_PRICE_ID=price_your_price_id_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Step 5: Test with Test Cards
Use Stripe test card: **4242 4242 4242 4242**
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

---

## 📋 What You Get

### ✅ 7-Day Free Trial
- Automatically starts on first login
- Countdown shown in Account menu
- Full access during trial

### ✅ $9.99/Month Subscription
- Stripe Checkout integration
- Automatic billing
- Customer portal for management

### ✅ Promo Codes (100 Lifetime Seats)
- Create codes via API
- Users apply in paywall
- Limited to first 100 users

### ✅ Content Protection
- Trial expired → Paywall blocks creation/download
- Subscribed → Full access
- Lifetime → Permanent access

---

## 🎨 UI Features

### Header Display
- **Trial**: "Trial Active - X days remaining"
- **Subscribed**: "Pro Subscriber" + Manage link
- **Lifetime**: "Lifetime Access"

### Paywall Modal
- Beautiful gradient design
- Mobile-responsive
- Feature list
- Promo code input
- Stripe Checkout button

---

## 🔧 Create Promo Code (Admin)

### Using curl:
```bash
curl -X POST https://your-domain.com/api/subscription/promo-codes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{
    "code": "LAUNCH100",
    "description": "First 100 users - Lifetime access"
  }'
```

### Using Postman:
1. POST to `/api/subscription/promo-codes`
2. Headers: `Authorization: Bearer YOUR_TOKEN`
3. Body: `{ "code": "LAUNCH100", "description": "..." }`

---

## 🧪 Testing Checklist

- [ ] New user gets 7-day trial
- [ ] Trial countdown shows in header
- [ ] Paywall appears after trial expires
- [ ] Stripe Checkout works
- [ ] Payment activates subscription
- [ ] Promo code grants lifetime access
- [ ] Download blocked for expired users
- [ ] Create blocked for expired users

---

## 📚 Full Documentation

- **Setup Guide**: `STRIPE_SETUP_GUIDE.md` (detailed instructions)
- **Implementation**: `PAYWALL_IMPLEMENTATION_SUMMARY.md` (technical details)

---

## 🆘 Quick Troubleshooting

### Webhook not working?
- Check URL is publicly accessible
- Use ngrok for local testing: `ngrok http 5000`
- Verify webhook secret is correct

### Subscription not activating?
- Check Stripe Dashboard → Webhooks → Recent deliveries
- Verify events are being received (200 status)
- Check backend logs for errors

### Trial not starting?
- Verify Firebase is connected
- Check browser console for errors
- Ensure user is authenticated

---

## 💰 Pricing

**Stripe Fees**: 2.9% + $0.30 per transaction
- $9.99 subscription → $0.59 fee
- **Net revenue**: $9.40 per subscriber

---

## 🎯 Next Steps

1. ✅ Complete Stripe setup (test mode)
2. ✅ Test all user flows
3. ✅ Create promo codes
4. ✅ Switch to live mode
5. ✅ Deploy to production

---

**You're ready to launch!** 🚀

For detailed setup instructions, see **STRIPE_SETUP_GUIDE.md**
