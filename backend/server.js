/**
 * Server Bootstrap & HTTP Listener
 */

const app = require('./app');
const config = require('./config/env');
const logger = require('./utils/logger');
const { seedDatabase } = require('./database/seeds');

async function startServer() {
  try {
    // 1. Initialize In-Memory Data Store with Seed Data
    logger.info('Initializing HealthSync AI database store...');
    await seedDatabase();

    // 2. Start HTTP Server
    const HOST = process.env.HOST || '127.0.0.1';
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
