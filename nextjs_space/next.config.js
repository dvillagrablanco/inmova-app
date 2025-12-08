/**
 * NEXT.CONFIG.JS OPTIMIZADO
 * 
 * Este archivo contiene todas las optimizaciones recomendadas.
 * Para aplicar:
 * 1. Haz backup del next.config.js actual
 * 2. Revisa las diferencias
 * 3. Reemplaza o merge manualmente
 * 
 * IMPORTANTE: Testa en desarrollo antes de deployment
 */

const path = require('path');
const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: process.env.NEXT_OUTPUT_MODE,
  
  // Optimizaciones de build
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../'),
    optimizeCss: true,
    webpackBuildWorker: true,
    // Mejora el tree-shaking
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
      'lodash',
      'recharts'
    ],
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Configuración de imágenes optimizada
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.abacusai.app',
      },
    ],
  },
  
  // Modularización de imports para mejor tree-shaking
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
      preventFullImport: true,
    },
    '@radix-ui/react-icons': {
      transform: '@radix-ui/react-icons/dist/{{member}}',
    },
  },
  
  // Headers de seguridad y performance
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
            value: 'SAMEORIGIN'
          },
        ],
      },
    ]
  },
  
  // Configuración avanzada de Webpack
  webpack: (config, { isServer, webpack }) => {
    // Optimización de chunks
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // Vendor principal
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            priority: 10,
            reuseExistingChunk: true,
          },
          // React y relacionados
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
            name: 'react-vendor',
            priority: 20,
            reuseExistingChunk: true,
          },
          // UI Libraries
          ui: {
            test: /[\\/]node_modules[\\/](@radix-ui|@headlessui|framer-motion)[\\/]/,
            name: 'ui-vendor',
            priority: 15,
            reuseExistingChunk: true,
          },
          // Charting libraries (lazy loaded)
          charts: {
            test: /[\\/]node_modules[\\/](recharts|chart\.js|react-chartjs-2)[\\/]/,
            name: 'charts-vendor',
            priority: 12,
            reuseExistingChunk: true,
          },
          // Date utilities
          dates: {
            test: /[\\/]node_modules[\\/](date-fns|dayjs|moment)[\\/]/,
            name: 'dates-vendor',
            priority: 11,
            reuseExistingChunk: true,
          },
          // Lodash
          lodash: {
            test: /[\\/]node_modules[\\/]lodash[\\/]/,
            name: 'lodash-vendor',
            priority: 11,
            reuseExistingChunk: true,
          },
          // Auth
          auth: {
            test: /[\\/]node_modules[\\/](next-auth|bcryptjs|jsonwebtoken)[\\/]/,
            name: 'auth-vendor',
            priority: 14,
            reuseExistingChunk: true,
          },
          // Stripe
          stripe: {
            test: /[\\/]node_modules[\\/](@stripe|stripe)[\\/]/,
            name: 'stripe-vendor',
            priority: 13,
            reuseExistingChunk: true,
          },
          // AWS SDK
          aws: {
            test: /[\\/]node_modules[\\/]@aws-sdk[\\/]/,
            name: 'aws-vendor',
            priority: 13,
            reuseExistingChunk: true,
          },
          // OCR y procesamiento pesado
          processing: {
            test: /[\\/]node_modules[\\/](tesseract\.js|pdf-parse|mammoth|jspdf)[\\/]/,
            name: 'processing-vendor',
            priority: 9,
            reuseExistingChunk: true,
          },
          // Prisma (solo server-side)
          prisma: {
            test: /[\\/]node_modules[\\/]@prisma[\\/]/,
            name: 'prisma-vendor',
            priority: 16,
            enforce: true,
            reuseExistingChunk: true,
          },
        },
        maxInitialRequests: 25,
        maxAsyncRequests: 25,
        minSize: 20000,
        maxSize: 244000,
      };
    }
    
    // Ignora módulos problemáticos que causan errores de parsing
    config.module.rules.push({
      test: /node_modules\/(css-tree|nano-css|playwright-core|@storybook)/,
      use: 'null-loader',
    });
    
    // Polyfills para Node.js en el cliente
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        stream: false,
        util: false,
        http: false,
        https: false,
        zlib: false,
        dns: false,
        child_process: false,
        os: false,
      };
    }
    
    // Define plugins para optimización
    config.plugins.push(
      new webpack.DefinePlugin({
        __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
      })
    );
    
    // Límites de tamaño (warnings)
    config.performance = {
      ...config.performance,
      maxAssetSize: 1024 * 1024, // 1MB
      maxEntrypointSize: 2.5 * 1024 * 1024, // 2.5MB
      hints: process.env.NODE_ENV === 'production' ? 'warning' : false,
    };
    
    return config;
  },
};

module.exports = nextConfig;
