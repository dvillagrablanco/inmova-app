// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment
    environment: process.env.NODE_ENV || 'development',

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    // Replay configuration
    replaysOnErrorSampleRate: 1.0, // Capture 100% of errors for replay
    replaysSessionSampleRate: 0.1, // Capture 10% of all sessions for replay

    integrations: [
      Sentry.replayIntegration({
        // Additional SDK configuration goes in here, for example:
        maskAllText: true,
        blockAllMedia: true,
      }),
      Sentry.browserTracingIntegration(),
    ],

    // Ignore common noise
    ignoreErrors: [
      // Hydration errors (these are often false positives in dev)
      'Hydration failed',
      'There was an error while hydrating',
      'Text content does not match',
      // Browser extensions
      'Non-Error promise rejection captured',
      // Network errors
      'NetworkError',
      'Failed to fetch',
      // ResizeObserver errors (not critical)
      'ResizeObserver loop',
    ],

    // Filter out sensitive data
    beforeSend(event) {
      // Remove sensitive query parameters
      if (event.request?.url) {
        try {
          const url = new URL(event.request.url);
          // Remove sensitive params
          ['password', 'token', 'api_key', 'secret'].forEach(param => {
            url.searchParams.delete(param);
          });
          event.request.url = url.toString();
        } catch (e) {
          // Invalid URL, ignore
        }
      }

      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }

      return event;
    },
  });
} else {
  console.log('[Sentry] Not initialized - NEXT_PUBLIC_SENTRY_DSN not configured');
}
