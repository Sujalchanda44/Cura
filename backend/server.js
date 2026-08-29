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
    const server = app.listen(config.port, () => {
      logger.success(`🚀 HealthSync AI Server running on port ${config.port} [${config.env}]`);
      logger.info(`📡 API Base URL: http://localhost:${config.port}/api`);
      logger.info(`🩺 Health Check: http://localhost:${config.port}/api/health`);
    });

    // 3. Graceful Shutdown
    const handleShutdown = (signal) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed. Exiting process.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (error) {
    logger.error('Fatal server startup error:', error);
    process.exit(1);
  }
}

startServer();
