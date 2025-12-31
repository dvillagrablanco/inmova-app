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
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns'],
  },

  // Build configuration
  typescript: {
    ignoreBuildErrors: false, // ✅ Re-habilitado después de corregir enums
  },
  eslint: {
    ignoreDuringBuilds: false, // ✅ Re-habilitado
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
      {
        protocol: 'https',
        hostname: 'cdn.abacus.ai',
      },
    ],
  },

  // Optimización de generación estática
  generateBuildId: async () => {
    return `${Date.now()}`;
  },

  // Cache headers for static assets
  async headers() {
    return [
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
    ];
  },

  // Compression
  compress: true,

  // Optimización de PoweredByHeader
  poweredByHeader: false,

  // Optimización de SWC Minify
  swcMinify: true,

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

      // Optimizar chunks para cliente
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
    }

    // Reduce logging
    config.infrastructureLogging = {
      level: 'error',
    };

    return config;
  },
};

module.exports = nextConfig;
