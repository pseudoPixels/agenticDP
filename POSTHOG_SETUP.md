# PostHog Session Recording Setup

## Overview
PostHog has been integrated into the application for session recording and analytics.

## What Was Added

### 1. Package Installation
```bash
npm install posthog-js
```

### 2. Files Created/Modified

#### **`frontend/src/posthog.js`** (New)
- Initializes PostHog with your project key
- Configured for session recording
- API host: `https://us.i.posthog.com`
- Auto-captures pageviews
- Session recording enabled with cross-origin iframe support

#### **`frontend/src/index.js`** (Modified)
- Imports PostHog initialization
- Ensures PostHog loads when the app starts

#### **`frontend/src/AppRouter.js`** (Modified)
- Added `PostHogPageView` component
- Tracks route changes automatically
- Captures pageview events on navigation

## Features Enabled

### ✅ Session Recording
- **Enabled by default** - All user sessions are recorded
- Records mouse movements, clicks, scrolls, and interactions
- Records across all pages and routes
- Cross-origin iframe recording enabled

### ✅ Automatic Pageview Tracking
- Captures pageviews on initial load
- Captures pageviews on route changes
- No manual event tracking needed

### ✅ Development Mode
- PostHog runs in development mode
- Can be disabled by uncommenting `posthog.opt_out_capturing()` in `posthog.js`

## Configuration

### Current Settings:
```javascript
{
  api_host: 'https://us.i.posthog.com',
  capture_pageview: true,
  session_recording: {
    recordCrossOriginIframes: true
  }
}
```

### To Disable in Development:
Uncomment this line in `frontend/src/posthog.js`:
```javascript
posthog.opt_out_capturing();
```

## What Gets Recorded

### Session Recordings Include:
- ✅ Mouse movements and clicks
- ✅ Scrolling behavior
- ✅ Form interactions
- ✅ Page navigation
- ✅ Button clicks
- ✅ Text input (can be masked if needed)
- ✅ All user interactions

### What's NOT Captured:
- ❌ No custom events (as requested)
- ❌ No manual tracking calls
- ❌ Only pageviews and session recordings

## Viewing Recordings

1. Go to [PostHog Dashboard](https://us.i.posthog.com)
2. Navigate to **Session Recordings**
3. View all recorded sessions with:
   - Full replay of user interactions
   - Console logs
   - Network activity
   - Performance metrics

## Privacy & Security

### Data Collected:
- Session recordings (visual replay)
- Pageview events
- User interactions
- Browser information
- Device information

### Sensitive Data:
- To mask sensitive input fields, add `data-ph-capture-attribute-*-mask` attributes
- To block elements from recording, add `ph-no-capture` class

Example:
```html
<input type="password" data-ph-capture-attribute-value-mask />
<div className="ph-no-capture">Sensitive content</div>
```

## Testing

1. Start the application:
```bash
cd frontend
npm start
```

2. Navigate through the app
3. Check PostHog dashboard for recordings (may take a few minutes to appear)

## Additional Configuration (Optional)

### To Add User Identification:
```javascript
import posthog from './posthog';

// After user logs in
posthog.identify(
  'user_id',
  { email: 'user@example.com', name: 'User Name' }
);
```

### To Add Custom Properties:
```javascript
posthog.capture('custom_event', {
  property1: 'value1',
  property2: 'value2'
});
```

### To Disable Session Recording:
In `posthog.js`, add:
```javascript
posthog.init('...', {
  disable_session_recording: true
});
```

## Troubleshooting

### Recordings Not Showing Up?
1. Check browser console for errors
2. Verify PostHog project key is correct
3. Check network tab for PostHog API calls
4. Wait a few minutes (recordings may be delayed)

### Performance Issues?
1. Session recording is lightweight but can impact performance on very slow devices
2. Consider disabling in development mode
3. Use sampling to record only a percentage of sessions

## Status

✅ **FULLY CONFIGURED AND READY**
- PostHog installed
- Session recording enabled
- Pageview tracking enabled
- No custom events (as requested)

---

**Project Key:** `phc_elNqb17vZi1Dff6l41eIHO4ZP6Bp7wuyamYRuYnXVEo`
**API Host:** `https://us.i.posthog.com`
**Date:** December 4, 2025
