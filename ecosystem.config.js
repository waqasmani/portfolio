/**
 * PM2 process file for VPS deployments without Docker.
 *
 *   npm run build
 *   pm2 start ecosystem.config.js
 *
 * IMPORTANT: this app intentionally runs as a single fork instance. The live
 * chat event bus and the rate limiter are in-process; cluster mode would
 * split them across workers and silently break SSE fan-out. To scale
 * horizontally, back both with Redis first (see README → Scaling).
 */
module.exports = {
  apps: [
    {
      name: 'portfolio',
      script: '.next/standalone/server.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      kill_timeout: 8000,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '127.0.0.1',
      },
    },
  ],
};
