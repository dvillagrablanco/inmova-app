// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
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

    replaysOnErrorSampleRate: 1.0,

    // This sets the sample rate to be 10%. You may want this to be 100% while
    // in development and sample at a lower rate in production
    replaysSessionSampleRate: 0.1,

    // You can remove this option if you're not planning to use the Sentry Session Replay feature:
    integrations: [
      Sentry.replayIntegration({
        // Additional Replay configuration goes in here, for example:
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Capture 100% of transactions for performance monitoring in production
    // Use tracesSampler to adjust sampling in production
    environment: process.env.NODE_ENV || 'development',

    beforeSend(event, hint) {
      // Filter out specific errors if needed
      const error = hint.originalException;
      
      if (error instanceof Error) {
        // Don't send errors from browser extensions
        if (error.message && error.message.includes('chrome-extension://')) {
          return null;
        }
        
        // Don't send errors from ad blockers
        if (error.message && error.message.includes('adsbygoogle')) {
          return null;
        }
      }
      
      return event;
    },
  });
} else {
  console.warn('[Sentry] DSN not configured. Error tracking disabled.');
}
