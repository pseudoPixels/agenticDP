import posthog from 'posthog-js';

// Initialize PostHog
posthog.init('phc_elNqb17vZi1Dff6l41eIHO4ZP6Bp7wuyamYRuYnXVEo', {
  api_host: 'https://us.i.posthog.com',
  capture_pageview: true,               // Automatically capture pageviews
  session_recording: {
    recordCrossOriginIframes: true,     // Enable recording in iframes
  },
  loaded: (posthog) => {
    if (process.env.NODE_ENV === 'development') {
      // Disable capturing in development mode (optional)
      // posthog.opt_out_capturing();
    }
  }
});

export default posthog;
