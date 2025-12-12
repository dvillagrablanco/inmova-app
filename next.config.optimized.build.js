const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: process.env.NEXT_OUTPUT_MODE || 'standalone',
  
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../'),
    // Optimize static page generation - increased timeout
    staticPageGenerationTimeout: 90,
    // Disable ISR memory cache to save memory during build
    isrMemoryCacheSize: 0,
    // Enable webpack memory optimizations
    webpackMemoryOptimizations: true,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    ignoreBuildErrors: false,
  },
  
  images: { 
    unoptimized: true 
  },
  
  // Production optimizations
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  compress: true,
  
  // Optimize build
  swcMinify: true,
  
  // Generate optimized build ID
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
  
  // Webpack configuration for optimization
  webpack: (config, { isServer }) => {
    // Optimize chunks
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Common chunk
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      };
    }
    return config;
  },
};

module.exports = nextConfig;
