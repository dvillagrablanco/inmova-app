/** @type {import('next').NextConfig} */
const nextConfig = {
  // Deshabilitar la recolección estática de datos de API routes durante build
  // Esto previene que Next.js intente ejecutar las APIs en build time
  experimental: {
    isrMemoryCacheSize: 0,
  },
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@swc/core-linux-x64-gnu',
      'node_modules/@swc/core-linux-x64-musl',
      'node_modules/@esbuild/linux-x64',
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }

    config.infrastructureLogging = {
      level: 'error',
    };

    return config;
  },
};

module.exports = nextConfig;
