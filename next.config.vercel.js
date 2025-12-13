const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel ya maneja el output automáticamente
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../'),
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: { 
    unoptimized: true,
    // Añadir dominios permitidos para Next/Image
    domains: [
      'abacusai-apps-030d8be4269891ba0e758624-us-west-2.s3.us-west-2.amazonaws.com',
      'inmova.app',
      's3.us-west-2.amazonaws.com'
    ],
  },
  // Headers de seguridad ya están en vercel.json
};

module.exports = nextConfig;
