/**
 * PM2 Ecosystem Config — Carlog
 * Placé à la racine du projet sur le serveur O2Switch
 * Usage : pm2 start ecosystem.config.js
 */
module.exports = {
  apps: [
    {
      name: 'carlog-api',
      script: './backend/src/app.js',
      cwd: '/home/<votre_user_o2switch>/carlog',   // ← à adapter

      instances: 1,                                 // 1 instance (mutualisé)
      exec_mode: 'fork',

      node_args: '--max-old-space-size=256',

      env: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },

      // Restart automatique
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,

      // Logs
      out_file: './logs/app.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,

      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: false,
    },
  ],
};
