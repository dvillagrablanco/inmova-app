const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: process.env.NEXT_OUTPUT_MODE,
  
  // ============================================
  // BUILD OPTIMIZATION SETTINGS
  // ============================================
  
  // 1. INCREASE BUILD TIMEOUT
  // Aumenta el timeout para builds complejos
  staticPageGenerationTimeout: 300, // 5 minutos (default: 60s)
  
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../'),
    
    // Optimización de workers para builds más rápidos
    workerThreads: true,
    cpus: 4,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: { unoptimized: true },
  
  // ============================================
  // 2. WEBPACK OPTIMIZATION - CHUNK SPLITTING
  // ============================================
  webpack: (config, { isServer, dev }) => {
    // Solo aplicar optimizaciones en producción
    if (!dev && !isServer) {
      // Configuración de optimización de chunks
      config.optimization = {
        ...config.optimization,
        
        // Habilitar tree shaking
        usedExports: true,
        sideEffects: true,
        
        // Configuración de división de código
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Separar vendor libraries grandes
            default: false,
            vendors: false,
            
            // Framework (React, Next.js)
            framework: {
              name: 'framework',
              test: /[\\/]node_modules[\\/](react|react-dom|next|scheduler)[\\/]/,
              priority: 40,
              enforce: true,
            },
            
            // Bibliotecas de UI (Radix, Shadcn)
            ui: {
              name: 'ui-libs',
              test: /[\\/]node_modules[\\/](@radix-ui|@headlessui|class-variance-authority|clsx|tailwind-merge)[\\/]/,
              priority: 30,
              enforce: true,
            },
            
            // Bibliotecas de gráficos (Recharts, Chart.js)
            charts: {
              name: 'chart-libs',
              test: /[\\/]node_modules[\\/](recharts|chart\\.js|react-chartjs-2|plotly\\.js|react-plotly\\.js)[\\/]/,
              priority: 25,
              enforce: true,
            },
            
            // Bibliotecas de fecha
            dates: {
              name: 'date-libs',
              test: /[\\/]node_modules[\\/](date-fns|dayjs|react-datepicker|react-big-calendar)[\\/]/,
              priority: 20,
              enforce: true,
            },
            
            // Bibliotecas de formularios
            forms: {
              name: 'form-libs',
              test: /[\\/]node_modules[\\/](react-hook-form|@hookform|formik|yup|zod)[\\/]/,
              priority: 20,
              enforce: true,
            },
            
            // Iconos (Lucide)
            icons: {
              name: 'icon-libs',
              test: /[\\/]node_modules[\\/](lucide-react)[\\/]/,
              priority: 15,
              minSize: 100000, // 100KB
            },
            
            // Autenticación
            auth: {
              name: 'auth-libs',
              test: /[\\/]node_modules[\\/](next-auth|bcryptjs|jsonwebtoken)[\\/]/,
              priority: 20,
              enforce: true,
            },
            
            // Prisma y Database
            database: {
              name: 'db-libs',
              test: /[\\/]node_modules[\\/](@prisma|prisma)[\\/]/,
              priority: 20,
              enforce: true,
            },
            
            // AWS y Storage
            storage: {
              name: 'storage-libs',
              test: /[\\/]node_modules[\\/](@aws-sdk)[\\/]/,
              priority: 15,
            },
            
            // Otras librerías comunes grandes
            commons: {
              name: 'commons',
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
              minChunks: 2,
              minSize: 100000, // Solo chunks > 100KB
              maxSize: 244000, // Dividir chunks > 244KB
            },
          },
          
          // Configuración global de tamaños
          maxInitialRequests: 25,
          maxAsyncRequests: 25,
          minSize: 20000, // 20KB mínimo
          maxSize: 244000, // 244KB máximo (dividir chunks más grandes)
        },
        
        // Minimización mejorada
        minimize: true,
        minimizer: [
          ...config.optimization.minimizer,
        ],
      };
      
      // ============================================
      // 3. TREE SHAKING OPTIMIZATION
      // ============================================
      
      // Configurar module para tree shaking
      config.module = {
        ...config.module,
        rules: [
          ...config.module.rules,
          {
            test: /\.m?js$/,
            type: 'javascript/auto',
            resolve: {
              fullySpecified: false,
            },
          },
        ],
      };
      
      // Configurar resolve para mejor tree shaking
      config.resolve = {
        ...config.resolve,
        alias: {
          ...config.resolve.alias,
          // Asegurar que se usen versiones ES modules para tree shaking
          'lodash': 'lodash-es',
        },
        mainFields: ['module', 'main'],
      };
      
      // Marcar side effects para tree shaking
      config.optimization.providedExports = true;
      config.optimization.usedExports = true;
      config.optimization.sideEffects = true;
      config.optimization.concatenateModules = true;
    }
    
    // Configuración común para dev y prod
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    
    return config;
  },
  
  // ============================================
  // PRODUCTION OPTIMIZATION
  // ============================================
  productionBrowserSourceMaps: false, // Deshabilitar source maps en producción
  poweredByHeader: false, // Remover header X-Powered-By
  compress: true, // Habilitar compresión gzip
  
  // Configuración de redirecciones y headers para optimización
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png|gif|ico|webp)',
        locale: false,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/fonts/:path*',
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
