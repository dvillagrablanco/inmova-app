const path = require('path');

/**
 * Configuración optimizada de Next.js para resolver problemas de memoria
 * y empaquetado en deployment público
 * 
 * INSTRUCCIONES:
 * 1. Respalda tu next.config.js actual
 * 2. Reemplaza el contenido con este archivo
 * 3. Ejecuta: yarn add null-loader -D
 * 4. Intenta el build: NODE_OPTIONS="--max-old-space-size=6144" yarn build
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: process.env.NEXT_OUTPUT_MODE,
  
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../'),
    // Optimizar el caché de compilación
    optimizeCss: true,
    // Habilitar workers para builds más rápidos
    webpackBuildWorker: true,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    ignoreBuildErrors: false,
  },
  
  images: { 
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Configuración de compresión y optimización
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,

  // Optimización de importaciones modulares
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
    '@radix-ui/react-icons': {
      transform: '@radix-ui/react-icons/dist/{{member}}',
    },
  },

  webpack: (config, { isServer, webpack }) => {
    // Resolver aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    };

    // Optimizar el splitting de chunks para reducir el tamaño del bundle
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000,
        cacheGroups: {
          // Vendor principal
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            priority: 10,
            reuseExistingChunk: true,
          },
          // React y React-DOM separados
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom|react-is)[\\/]/,
            name: 'react',
            priority: 20,
            reuseExistingChunk: true,
          },
          // Librerías UI pesadas
          ui: {
            test: /[\\/]node_modules[\\/](@radix-ui|@headlessui|framer-motion)[\\/]/,
            name: 'ui-libs',
            priority: 15,
            reuseExistingChunk: true,
          },
          // Charts y visualizaciones - MUY PESADOS
          charts: {
            test: /[\\/]node_modules[\\/](recharts|plotly\.js|react-plotly\.js|chart\.js|react-chartjs-2)[\\/]/,
            name: 'charts',
            priority: 15,
            reuseExistingChunk: true,
          },
          // Utilidades de fecha
          dateUtils: {
            test: /[\\/]node_modules[\\/](date-fns|dayjs|moment)[\\/]/,
            name: 'date-utils',
            priority: 12,
            reuseExistingChunk: true,
          },
          // Lodash separado
          lodash: {
            test: /[\\/]node_modules[\\/]lodash[\\/]/,
            name: 'lodash',
            priority: 12,
            reuseExistingChunk: true,
          },
          // Next.js y auth
          nextAuth: {
            test: /[\\/]node_modules[\\/](next-auth|@next-auth)[\\/]/,
            name: 'next-auth',
            priority: 15,
            reuseExistingChunk: true,
          },
          // Stripe
          stripe: {
            test: /[\\/]node_modules[\\/](@stripe|stripe)[\\/]/,
            name: 'stripe',
            priority: 15,
            reuseExistingChunk: true,
          },
          // AWS SDK
          aws: {
            test: /[\\/]node_modules[\\/]@aws-sdk[\\/]/,
            name: 'aws-sdk',
            priority: 15,
            reuseExistingChunk: true,
          },
          // OCR y procesamiento pesado
          processing: {
            test: /[\\/]node_modules[\\/](tesseract\.js|pdf-parse|mammoth|jspdf)[\\/]/,
            name: 'processing',
            priority: 15,
            reuseExistingChunk: true,
          },
          // Prisma (solo server-side)
          ...(isServer && {
            prisma: {
              test: /[\\/]node_modules[\\/](@prisma|\.prisma)[\\/]/,
              name: 'prisma',
              priority: 20,
              reuseExistingChunk: true,
            },
          }),
        },
      },
    };

    // Ignorar módulos problemáticos en el cliente
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        child_process: false,
        dns: false,
        perf_hooks: false,
      };

      // Ignorar locales de moment que no se usan
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^\.\/locale$/,
          contextRegExp: /moment$/,
        })
      );
    }

    // Excluir módulos problemáticos que causan errores de parsing
    // Estos son módulos de desarrollo o que no se necesitan en runtime
    config.module.rules.push({
      test: /node_modules[\\/](css-tree|nano-css|playwright-core|@storybook)[\\/]/,
      use: 'null-loader',
    });

    // Optimizar el procesamiento de fuentes
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/i,
      type: 'asset/resource',
      generator: {
        filename: 'static/fonts/[hash][ext][query]',
      },
    });

    // Limitar el tamaño de los chunks
    config.performance = {
      ...config.performance,
      maxAssetSize: 1024 * 1024, // 1MB
      maxEntrypointSize: 1024 * 1024 * 2.5, // 2.5MB
      hints: 'warning',
    };

    return config;
  },

  // Headers de seguridad y caché
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
