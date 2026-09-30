/**
 * Server Bootstrap & HTTP Listener
 */

const app = require('./app');
const config = require('./config/env');
const logger = require('./utils/logger');

async function startServer() {
  try {
    // 1. Log database connection mode
    const { isSupabaseConfigured } = require('./services/supabaseService');
    if (isSupabaseConfigured) {
      logger.info('Connected to Supabase PostgreSQL database.');
    } else {
      logger.warn('Supabase not configured. Using local in-memory store.');
    }

    // 2. Start HTTP Server
    const HOST = process.env.HOST || '0.0.0.0';
    const server = app.listen(config.port, HOST, () => {
      logger.success(`🚀 HealthSync AI Server running on http://${HOST}:${config.port} [${config.env}]`);
      logger.info(`📡 API Base URL: http://${HOST}:${config.port}/api`);
      logger.info(`🩺 Health Check: http://${HOST}:${config.port}/api/health`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.warn(`Port ${config.port} is busy. Retrying in 1.5 seconds...`);
        setTimeout(() => {
          server.close();
          server.listen(config.port, HOST);
        }, 1500);
        return;
      }
      logger.error(`Server listen error:`, err);
      process.exit(1);
    });

    // 3. Graceful Shutdown
    const handleShutdown = (signal) => {
      logger.info(`Received ${signal}. Closing HTTP server...`);
      server.close();
    };

    process.once('SIGTERM', () => handleShutdown('SIGTERM'));
    process.once('SIGINT', () => handleShutdown('SIGINT'));
  } catch (error) {
    logger.error('Fatal server startup error:', error);
    process.exit(1);
  }
}

startServer();
