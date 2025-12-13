// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN && !SENTRY_DSN.includes('placeholder')) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 0.1,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    // Capture 100% of transactions for performance monitoring
    // In production, you might want to adjust this
    environment: process.env.NODE_ENV || 'development',

    beforeSend(event, hint) {
      // Filter out specific errors if needed
      const error = hint.originalException;
      
      if (error instanceof Error) {
        // Don't send certain database connection errors (might be temporary)
        if (error.message && error.message.includes('ECONNREFUSED')) {
          console.error('[Sentry] Filtered ECONNREFUSED error:', error.message);
          return null;
        }
      }
      
      return event;
    },

    // Additional context for server-side errors
    integrations: [
      // Add custom integrations here if needed
    ],
  });
} else {
  console.warn('[Sentry] DSN not configured. Error tracking disabled.');
}
