/**
 * Logger Module
 *
 * Structured logging using Winston.
 * Provides consistent log format across the application.
 */

const winston = require('winston');
const config = require('./config');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  config.logging.format === 'json'
    ? winston.format.json()
    : winston.format.printf(({ level, message, timestamp, ...metadata }) => {
        let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        if (Object.keys(metadata).length > 0) {
          msg += ` ${JSON.stringify(metadata)}`;
        }
        return msg;
      })
);

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: config.app.name },
  transports: [
    // Console transport
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true
    })
  ]
});

// Add file transport in production (optional)
if (config.nodeEnv === 'production') {
  // Uncomment to enable file logging
  // logger.add(new winston.transports.File({
  //   filename: 'logs/error.log',
  //   level: 'error',
  //   maxsize: 5242880, // 5MB
  //   maxFiles: 5
  // }));
  // logger.add(new winston.transports.File({
  //   filename: 'logs/combined.log',
  //   maxsize: 5242880, // 5MB
  //   maxFiles: 5
  // }));
}

// Export logger methods
module.exports = {
  debug: (message, meta = {}) => logger.debug(message, meta),
  info: (message, meta = {}) => logger.info(message, meta),
  warn: (message, meta = {}) => logger.warn(message, meta),
  error: (message, meta = {}) => logger.error(message, meta),
  // Export raw logger for advanced usage
  logger
};
