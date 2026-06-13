module.exports = {
  apps: [
    {
      name: 'mystrangeidol-server',
      script: './index.js',
      watch: false,
      instances: 1,
      autorestart: true,
      max_memory_restart: '1024M',
      env_production: {
        NODE_ENV: 'production',
      },
      env_file: '.env.production',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      combine_logs: true,
      merge_logs: true,
    },
  ],
}
