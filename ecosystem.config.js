module.exports = {
  apps: [
    {
      name: 'be-iqx',
      script: 'dist/app.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3030
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3030
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3030
      },
      // Logging configuration
      log_file: 'logs/pm2-combined.log',
      out_file: 'logs/pm2-out.log',
      error_file: 'logs/pm2-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Advanced PM2 features
      exec_mode: 'fork',
      min_uptime: '10s',
      max_restarts: 10,
      
      // Health monitoring
      health_check_grace_period: 3000,
      
      // Environment variables for database and other configs
      // Note: You should set these in your .env file or environment
      // This is just to show the structure
      env_vars: {
        // Database
        DB_HOST: 'localhost',
        DB_PORT: 5432,
        DB_NAME: 'iqx_stocks',
        DB_USER: 'postgres',
        // DB_PASSWORD: 'your_password', // Set this in .env file
        
        // API Configuration
        SIMPLIZE_REQUEST_DELAY: 1000,
        SIMPLIZE_MAX_RETRIES: 3,
        
        // Rate limiting
        RATE_LIMIT_WINDOW_MS: 900000,
        RATE_LIMIT_MAX_REQUESTS: 100,
        
        // Logging
        LOG_LEVEL: 'info',
        LOG_FILE: 'logs/app.log'
      }
    }
  ],

  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'node',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/be-iqx.git',
      path: '/var/www/be-iqx',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
