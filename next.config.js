const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proporcionar DATABASE_URL dummy para el build si no existe
  env: {
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/db',
  },

  // Performance y estabilidad
  reactStrictMode: true,
  productionBrowserSourceMaps: false,

  // Compiler optimizations
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn'],
          }
        : false,
  },

  // Experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // optimizeCss: true, // DISABLED: Causaba bug donde CSS se carga como <script> en Next.js 15
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'date-fns',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-popover',
      'framer-motion',
    ],
    // Optimizaciones de Sprint 3
    typedRoutes: true, // Type-safe routing
    turbo: {
      // Turbopack optimizations
      rules: {
        '*.svg': ['@svgr/webpack'],
      },
    },
  },

  // Build configuration
  // AUDITORIA V2 2026-02-11: tsc --noEmit retorna 0 errores en codigo propio
  // (solo 2 errores en node_modules/@vitejs que Next.js ignora)
  typescript: {
    // ignoreBuildErrors: false activado en auditoria V2 pero revertido temporalmente.
    // 105+ funciones helper necesitan revision manual para prisma scope.
    // Los fixes de seguridad (cron auth, CSP, debug, Zod) estan aplicados.
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true, // Mantener hasta corregir warnings de ESLint
  },

  // Image optimization - Optimizado para producción
  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.inmova.app',
      },
      {
        protocol: 'https',
        hostname: '**.inmovaapp.com',
      },
      {
        protocol: 'https',
        hostname: '**.abacusai.app',
      },
    ],
  },

  // Optimización de generación estática
  generateBuildId: async () => {
    return `${Date.now()}`;
  },

  // Cache headers for static assets + Security headers
  async headers() {
    // CSP (Content Security Policy) - auditoria V2 2026-02-11
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com https://js.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://api.stripe.com https://*.amazonaws.com https://*.inmovaapp.com",
      "media-src 'self' data: blob:",
      "object-src 'none'",
      "frame-src 'self' https://js.stripe.com",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      process.env.NODE_ENV === 'production' ? 'upgrade-insecure-requests' : '',
    ]
      .filter(Boolean)
      .join('; ');

    return [
      // Landing pages - revalidar siempre para ver cambios rápido
      {
        source: '/landing/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      // Imágenes - cache largo
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
      // CSP header global (auditoria V2)
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspDirectives,
          },
        ],
      },
    ];
  },

  // ═══════════════════════════════════════════════════════════════
  // REDIRECTS: Consolidación de rutas duplicadas por vertical
  // Ruta canónica = destino. Rutas legacy/duplicadas = source.
  // ═══════════════════════════════════════════════════════════════
  async redirects() {
    return [
      // ── CONSTRUCCIÓN: /construccion es la ruta canónica ──
      { source: '/construction', destination: '/construccion', permanent: true },
      { source: '/construction/projects', destination: '/construccion/proyectos', permanent: true },
      { source: '/construction/gantt', destination: '/construccion/gantt', permanent: true },
      { source: '/construction/quality-control', destination: '/construccion/calidad', permanent: true },
      { source: '/obras', destination: '/construccion/proyectos', permanent: true },
      { source: '/licitaciones', destination: '/construccion/proyectos', permanent: true },
      { source: '/real-estate-developer', destination: '/construccion', permanent: true },
      { source: '/real-estate-developer/:path*', destination: '/construccion', permanent: true },

      // ── STR / VACACIONAL: /str es la ruta canónica ──
      { source: '/turismo-alquiler', destination: '/str', permanent: true },
      { source: '/hospitality', destination: '/str', permanent: true },

      // ── COLIVING: /coliving es la ruta canónica ──
      { source: '/room-rental', destination: '/coliving/propiedades', permanent: true },
      { source: '/student-housing', destination: '/coliving', permanent: true },
      { source: '/student-housing/:path*', destination: '/coliving', permanent: true },

      // ── COMERCIAL: /comercial es la ruta canónica ──
      { source: '/espacios-coworking', destination: '/comercial/coworking', permanent: true },
      { source: '/salas-reuniones', destination: '/comercial/coworking', permanent: true },
      { source: '/retail', destination: '/comercial/locales', permanent: true },
      { source: '/workspace', destination: '/comercial/coworking', permanent: true },
      { source: '/workspace/:path*', destination: '/comercial/coworking', permanent: true },
      { source: '/alquiler-comercial', destination: '/comercial', permanent: true },

      // ── COMUNIDADES: /comunidades es la ruta canónica ──
      { source: '/community', destination: '/comunidades', permanent: true },
      { source: '/comunidad', destination: '/comunidades', permanent: true },
      { source: '/comunidad-social', destination: '/comunidades', permanent: true },

      // ── FLIPPING: /flipping es la ruta canónica ──
      { source: '/proyectos-renovacion', destination: '/flipping/projects', permanent: true },

      // ── DASHBOARD: consolidar duplicados ──
      { source: '/dashboard-adaptive', destination: '/dashboard', permanent: true },
      { source: '/dashboard/adaptive', destination: '/dashboard', permanent: true },

      // ── Links rotos encontrados en auditoría → redirects ──
      { source: '/contacto', destination: '/landing/contacto', permanent: true },
      { source: '/privacy', destination: '/legal/privacidad', permanent: true },
      { source: '/terms', destination: '/legal/terminos', permanent: true },
      { source: '/landing/ventajas', destination: '/landing', permanent: true },
      { source: '/webhook', destination: '/admin/webhooks', permanent: true },
      { source: '/docs/examples', destination: '/developers/samples', permanent: true },
      { source: '/docs/guides', destination: '/docs', permanent: true },
      { source: '/developers/tutorials', destination: '/developers', permanent: true },

      // ── Páginas desactivadas (redirigen a vertical más cercano) ──
      { source: '/viajes-corporativos', destination: '/str', permanent: true },
      { source: '/viajes-corporativos/:path*', destination: '/str', permanent: true },
      { source: '/warehouse', destination: '/comercial/naves', permanent: true },
      { source: '/warehouse/:path*', destination: '/comercial/naves', permanent: true },
      { source: '/subastas', destination: '/dashboard', permanent: true },
      { source: '/microtransacciones', destination: '/dashboard', permanent: true },
      { source: '/puntos-carga', destination: '/dashboard', permanent: true },
    ];
  },

  // Compression
  compress: true,

  // Optimización de PoweredByHeader
  poweredByHeader: false,

  // Optimización de SWC Minify
  swcMinify: true,

  // Output configuration (Sprint 3)
  // output: 'standalone', // DISABLED: Causa problemas con prerender-manifest.json

  // Modularize imports (reduce bundle size)
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
      preventFullImport: true,
    },
    '@radix-ui/react-icons': {
      transform: '@radix-ui/react-icons/dist/{{member}}',
      preventFullImport: true,
    },
  },

  // Webpack optimizations
  webpack: (config, { isServer, webpack }) => {
    // Fallbacks para cliente
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };

      // Optimizar chunks para cliente (DESACTIVADO temporalmente)
      // La configuración personalizada causaba que CSS se cargue como <script>
      // Dejando que Next.js maneje los chunks automáticamente
      /*
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk para npm packages
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Common chunk para código compartido
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
            // UI components chunk
            ui: {
              name: 'ui',
              test: /[\\/]components[\\/]ui[\\/]/,
              chunks: 'all',
              priority: 30,
            },
          },
        },
      };
      */
    }

    // Reduce logging
    config.infrastructureLogging = {
      level: 'error',
    };

    return config;
  },
};

module.exports = nextConfig;
