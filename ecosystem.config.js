/**
 * PM2 ECOSYSTEM CONFIG - INMOVA APP
 * Configuración para deployment en servidor con PM2
 */

module.exports = {
  apps: [
    {
      name: 'inmova-app',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 2, // 2 workers para load balancing
      exec_mode: 'cluster', // Cluster mode
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,

      // Environment variables
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Las siguientes variables deben estar en .env.production
        // DATABASE_URL: 'postgresql://...',
        // NEXTAUTH_SECRET: '...',
        // NEXTAUTH_URL: 'https://...',
      },

      // Logs
      out_file: '/var/log/inmova/out.log',
      error_file: '/var/log/inmova/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Advanced features
      source_map_support: true,
      instance_var: 'INSTANCE_ID',
    },
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: process.env.SERVER_HOST || 'SERVER_IP',
      ref: 'origin/main',
      repo: 'git@github.com:inmova/inmova-app.git',
      path: '/opt/inmova-app',
      'post-deploy':
        'npm ci && npx prisma generate && npx prisma migrate deploy && npm run build && pm2 reload ecosystem.config.js --update-env',
      'pre-deploy-local': '',
      'post-setup': 'npm ci && npx prisma generate',
    },
  },
};
