/**
 * StatHaus Backend API
 *
 * Production-grade backend for StatHaus PWA with OAuth2/OIDC and Redis sync.
 * Supports any OAuth2/OIDC-compliant provider (Authentik, Keycloak, Auth0, etc.)
 */

const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');

const config = require('./config');
const logger = require('./logger');
const { setupRedis, closeRedis } = require('./redis');
const { setupOAuth } = require('./oauth');

// Import routes
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const syncRoutes = require('./routes/sync');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

/**
 * Start the server
 */
async function startServer() {
  try {
    logger.info(`Starting ${config.app.name} v${config.app.version}...`, {
      nodeEnv: config.nodeEnv,
      port: config.port
    });

    // Create Express app
    const app = express();

    // Security middleware
    app.use(helmet());

    // CORS middleware
    app.use(cors(config.cors));

    // HTTP request logging
    const morganStream = {
      write: (message) => logger.info(message.trim())
    };
    app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev', { stream: morganStream }));

    // Body parsing
    app.use(express.json({ limit: config.security.maxPayloadSize }));
    app.use(express.urlencoded({ extended: true, limit: config.security.maxPayloadSize }));

    // Initialize Redis connection
    await setupRedis();

    // Initialize OAuth2/OIDC client
    await setupOAuth();

    // Note: Rate limiting is handled at the Traefik ingress level
    // See: matrix-ess-hetzner/ansible/playbooks/21-traefik-security.yml

    // Mount routes
    app.use('/api/health', healthRoutes);
    app.use('/api/auth', authRoutes);
    app.use('/api/sync', syncRoutes);

    // Root endpoint
    app.get('/', (req, res) => {
      res.json({
        name: config.app.name,
        version: config.app.version,
        status: 'running'
      });
    });

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`
      });
    });

    // Global error handler (must be last)
    app.use(errorHandler);

    // Start HTTP server
    const server = app.listen(config.port, () => {
      logger.info(`${config.app.name} listening on port ${config.port}`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      // Stop accepting new connections
      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          // Close Redis connection
          await closeRedis();

          logger.info('Graceful shutdown complete');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown', { error: error.message });
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 10000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled promise rejection', { reason, promise });
      shutdown('unhandledRejection');
    });

  } catch (error) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Start the server
startServer();
