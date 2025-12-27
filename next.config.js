const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: process.env.NEXT_OUTPUT_MODE,
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../'),
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Mantener en true para evitar timeouts en Vercel (ver IMPORTANTE_ANTES_DE_DESPLEGAR.md)
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignorar errores durante el build
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true,
    domains: [
      'inmova-bucket.s3.amazonaws.com',
      'inmova-bucket.s3.eu-west-1.amazonaws.com',
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com',
    ],
  },
  
  // Security Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'X-Deployment-Version',
            value: process.env.VERCEL_GIT_COMMIT_SHA || 'dev'
          }
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate'
          },
          {
            key: 'Pragma',
            value: 'no-cache'
          },
          {
            key: 'Expires',
            value: '0'
          },
          {
            key: 'Surrogate-Control',
            value: 'no-store'
          }
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
      },
    ];
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
  
  // Rewrites for API optimization
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    };
  },
  
  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Optimizaciones de bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    
    return config;
  },
  
  // Performance optimizations
  swcMinify: false,
  compress: false,
  poweredByHeader: false,
  
  // Logging
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
};

module.exports = nextConfig;
