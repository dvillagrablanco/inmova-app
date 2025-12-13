/** @type {import('next').NextConfig} */
const nextConfig = {
  // Usar directorio .next estándar (sin variables ambiguas)
  distDir: '.next',
  
  // IMPORTANTE: NO usar 'output: standalone' para compatibilidad con 'yarn start'
  // El modo standalone requiere 'node server.js', no 'next start'
  // Railway funciona mejor con el enfoque estándar
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: { 
    unoptimized: true 
  },
};

module.exports = nextConfig;
