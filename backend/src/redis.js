/**
 * Redis Client Module
 *
 * Manages Redis connection with automatic reconnection and error handling.
 */

const Redis = require('ioredis');
const config = require('./config');
const logger = require('./logger');

let redisClient = null;

/**
 * Setup Redis client with configuration
 * @returns {Promise<Redis>} Redis client instance
 */
async function setupRedis() {
  try {
    redisClient = new Redis(config.redis);

    // Event handlers
    redisClient.on('connect', () => {
      logger.info('Redis client connecting...');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready', {
        host: config.redis.host,
        port: config.redis.port,
        db: config.redis.db
      });
    });

    redisClient.on('error', (error) => {
      logger.error('Redis client error', { error: error.message });
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
    });

    redisClient.on('reconnecting', (time) => {
      logger.info('Redis client reconnecting', { delay: time });
    });

    // Test connection
    await redisClient.ping();
    logger.info('Redis connection test successful');

    return redisClient;
  } catch (error) {
    logger.error('Failed to setup Redis client', { error: error.message });
    throw error;
  }
}

/**
 * Get the Redis client instance
 * @returns {Redis} Redis client
 */
function getRedis() {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call setupRedis() first.');
  }
  return redisClient;
}

/**
 * Close Redis connection gracefully
 * @returns {Promise<void>}
 */
async function closeRedis() {
  if (redisClient) {
    logger.info('Closing Redis connection...');
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis connection closed');
  }
}

module.exports = {
  setupRedis,
  getRedis,
  closeRedis
};
