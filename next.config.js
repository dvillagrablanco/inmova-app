/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true, // Ignora errores de estilo
  },
  typescript: {
    ignoreBuildErrors: true, // Ignora errores de tipos
  },
  // Solución para errores de memoria/webpack en builds grandes
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
};

module.exports = nextConfig;
