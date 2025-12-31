/**
 * Lighthouse CI Configuration
 *
 * Configura umbrales de performance, accesibilidad y mejores prácticas
 */

module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3, // Correr 3 veces para promedio
      startServerCommand: 'yarn start',
      startServerReadyPattern: 'ready',
      startServerReadyTimeout: 60000,
      url: [
        'http://localhost:3000/landing',
        'http://localhost:3000/login',
        'http://localhost:3000/dashboard',
      ],
      settings: {
        preset: 'desktop',
        chromeFlags: '--no-sandbox --disable-gpu',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
    },
    assert: {
      assertions: {
        // Performance
        'categories:performance': ['error', { minScore: 0.85 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'speed-index': ['warn', { maxNumericValue: 3000 }],

        // Accessibility
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'color-contrast': 'error',
        'image-alt': 'error',
        label: 'error',
        'valid-lang': 'error',
        'aria-allowed-attr': 'error',
        'aria-required-attr': 'error',
        'aria-valid-attr': 'error',
        'button-name': 'error',
        'document-title': 'error',
        'heading-order': 'warn',
        'html-has-lang': 'error',
        'html-lang-valid': 'error',
        'link-name': 'error',
        'meta-viewport': 'error',

        // Best Practices
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'errors-in-console': 'warn',
        'no-vulnerable-libraries': 'warn',
        'is-on-https': 'off', // Solo para local

        // SEO
        'categories:seo': ['error', { minScore: 0.95 }],
        'meta-description': 'error',
        'font-size': 'error',
        'tap-targets': 'error',
        'robots-txt': 'off', // Optional
        canonical: 'warn',

        // PWA (optional, si implementas)
        // 'categories:pwa': ['warn', { minScore: 0.5 }],
      },
    },
    upload: {
      target: 'temporary-public-storage', // Guarda reportes por 7 días
    },
    server: {
      // Configura servidor para reportes (opcional)
    },
  },
};
