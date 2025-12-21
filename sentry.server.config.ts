// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment
    environment: process.env.NODE_ENV || 'development',

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    integrations: [
      Sentry.prismaIntegration(),
    ],

    // Ignore common noise
    ignoreErrors: [
      // Prisma connection errors (already logged elsewhere)
      'PrismaClientKnownRequestError',
      // Next.js build errors
      'ENOENT',
      'EPIPE',
    ],

    // Filter out sensitive data
    beforeSend(event) {
      // Remove sensitive data from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
          if (breadcrumb.data) {
            // Remove sensitive fields
            delete breadcrumb.data.password;
            delete breadcrumb.data.token;
            delete breadcrumb.data.apiKey;
            delete breadcrumb.data.secret;
          }
          return breadcrumb;
        });
      }

      // Remove sensitive context
      if (event.contexts) {
        if (event.contexts.request?.headers) {
          const headers = event.contexts.request.headers as Record<string, any>;
          delete headers.authorization;
          delete headers.cookie;
        }
      }

      return event;
    },

    // Attach user context (non-sensitive info only)
    beforeSendTransaction(transaction) {
      // Remove query parameters from transaction names
      if (transaction.transaction) {
        transaction.transaction = transaction.transaction.split('?')[0];
      }
      return transaction;
    },
  });
} else {
  console.log('[Sentry] Not initialized - SENTRY_DSN not configured');
}
