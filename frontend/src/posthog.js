import posthog from 'posthog-js';

// Initialize PostHog
posthog.init('phc_VK5zmDm6PUCpjy9UXvbS2Eaf1io2FZd9iNtDs56eGqm', {
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
