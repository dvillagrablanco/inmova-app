/**
 * PM2 Ecosystem Configuration
 * Para producción con auto-restart, cluster mode y monitoreo
 */

module.exports = {
  apps: [
    {
      name: 'inmova-app',
      script: 'npm',
      args: 'start',
      cwd: '/opt/inmova-app',
      
      // Execution Mode
      instances: 2, // Cluster mode: 2 instancias
      exec_mode: 'cluster',
      
      // Environment
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      
      // Logs
      out_file: '/var/log/inmova/out.log',
      error_file: '/var/log/inmova/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Auto-Restart Configuration
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      
      // Restart Delay
      restart_delay: 4000, // 4 segundos entre restarts
      
      // Kill Timeout
      kill_timeout: 5000, // 5 segundos para graceful shutdown
      
      // Watch (desactivado en producción)
      watch: false,
      ignore_watch: ['node_modules', '.next', 'logs'],
      
      // Time
      time: true,
      
      // Source Map Support
      source_map_support: true,
      
      // Graceful Shutdown
      listen_timeout: 3000,
      shutdown_with_message: true,
      
      // Health Check (experimental)
      wait_ready: true,
      
      // Cron Restart (opcional: restart diario a las 3 AM)
      // cron_restart: '0 3 * * *',
      
      // Environment Variables (se cargan desde .env.production)
      env_file: '/opt/inmova-app/.env.production',
    },
  ],
  
  // Deploy Configuration (opcional)
  deploy: {
    production: {
      user: 'root',
      host: '157.180.119.236',
      ref: 'origin/main',
      repo: 'https://github.com/tu-usuario/inmova-app.git',
      path: '/opt/inmova-app',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'mkdir -p /var/log/inmova',
    },
  },
};
