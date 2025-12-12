const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: process.env.NEXT_OUTPUT_MODE || 'standalone',
  
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../'),
    // Reducir tiempo de generación estática por página
    staticPageGenerationTimeout: 30,
    // Reducir memoria de caché ISR
    isrMemoryCacheSize: 0,
    // Optimización de memoria
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
  
  // Optimizaciones de producción
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  compress: true,
  
  // Generar menos páginas estáticas durante el build
  // Las páginas Client Component se renderizarán bajo demanda
  generateBuildId: async () => {
    // Usar timestamp para invalidar cachés
    return `build-${Date.now()}`;
  },
};

module.exports = nextConfig;
