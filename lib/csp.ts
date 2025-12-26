/**
 * Content Security Policy (CSP) Configuration
 * Helps prevent XSS, clickjacking, and other code injection attacks
 */

export interface CSPConfig {
  'default-src': string[];
  'script-src': string[];
  'style-src': string[];
  'img-src': string[];
  'font-src': string[];
  'connect-src': string[];
  'media-src': string[];
  'object-src': string[];
  'frame-src': string[];
  'base-uri': string[];
  'form-action': string[];
  'frame-ancestors': string[];
  'upgrade-insecure-requests': boolean;
}

export const cspConfig: CSPConfig = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-eval'", // Required for Next.js dev mode
    "'unsafe-inline'", // Required for Next.js
    'https://cdn.jsdelivr.net',
    'https://unpkg.com',
    'https://js.stripe.com',
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for styled-components and Tailwind
    'https://fonts.googleapis.com',
  ],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https:',
    'http:', // For development
  ],
  'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
  'connect-src': [
    "'self'",
    'https://api.stripe.com',
    'https://*.amazonaws.com', // For S3
    process.env.NEXT_PUBLIC_API_URL || '',
  ].filter(Boolean),
  'media-src': ["'self'", 'data:', 'blob:'],
  'object-src': ["'none'"],
  'frame-src': ["'self'", 'https://js.stripe.com'],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'self'"],
  'upgrade-insecure-requests': true,
};

/**
 * Converts CSP config object to CSP header string
 */
export function generateCSPHeader(config: CSPConfig = cspConfig): string {
  const directives: string[] = [];

  Object.entries(config).forEach(([key, value]) => {
    if (key === 'upgrade-insecure-requests') {
      if (value && process.env.NODE_ENV === 'production') {
        directives.push('upgrade-insecure-requests');
      }
    } else if (Array.isArray(value) && value.length > 0) {
      directives.push(`${key} ${value.join(' ')}`);
    }
  });

  return directives.join('; ');
}

/**
 * Security headers configuration
 */
export const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: generateCSPHeader(),
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

/**
 * Apply security headers to a response
 */
export function applySecurityHeaders(headers: Headers): Headers {
  securityHeaders.forEach(({ key, value }) => {
    headers.set(key, value);
  });
  return headers;
}
