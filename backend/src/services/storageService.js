/**
 * Storage Service
 *
 * Handles user data storage in Redis.
 */

const { getRedis } = require('../redis');
const logger = require('../logger');

// Redis key prefixes
const KEY_PREFIX = 'stathaus:user:';
const DATA_SUFFIX = ':data';
const METADATA_SUFFIX = ':metadata';

/**
 * Get user data from Redis
 * @param {string} userId User ID
 * @returns {Promise<Object|null>} User data or null if not found
 */
async function getUserData(userId) {
  try {
    const redis = getRedis();
    const key = `${KEY_PREFIX}${userId}${DATA_SUFFIX}`;

    const data = await redis.get(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data);
  } catch (error) {
    logger.error('Failed to get user data', { userId, error: error.message });
    throw new Error('Failed to retrieve user data from storage');
  }
}

/**
 * Save user data to Redis
 * @param {string} userId User ID
 * @param {Object} data User data (meters and readings)
 * @returns {Promise<Object>} Metadata about the save operation
 */
async function saveUserData(userId, data) {
  try {
    const redis = getRedis();
    const dataKey = `${KEY_PREFIX}${userId}${DATA_SUFFIX}`;
    const metadataKey = `${KEY_PREFIX}${userId}${METADATA_SUFFIX}`;

    const timestamp = Date.now();
    const dataJson = JSON.stringify(data);

    // Save data
    await redis.set(dataKey, dataJson);

    // Save metadata
    const metadata = {
      lastUpdated: timestamp,
      size: Buffer.byteLength(dataJson, 'utf8'),
      meterTypesCount: data.meterTypes?.length || 0,
      metersCount: data.meters?.length || 0,
      readingsCount: data.readings?.length || 0
    };

    await redis.set(metadataKey, JSON.stringify(metadata));

    logger.info('User data saved successfully', {
      userId,
      meterTypesCount: metadata.meterTypesCount,
      metersCount: metadata.metersCount,
      readingsCount: metadata.readingsCount,
      size: metadata.size
    });

    return metadata;
  } catch (error) {
    logger.error('Failed to save user data', { userId, error: error.message });
    throw new Error('Failed to save user data to storage');
  }
}

/**
 * Get user data metadata
 * @param {string} userId User ID
 * @returns {Promise<Object|null>} Metadata or null if not found
 */
async function getUserMetadata(userId) {
  try {
    const redis = getRedis();
    const key = `${KEY_PREFIX}${userId}${METADATA_SUFFIX}`;

    const metadata = await redis.get(key);

    if (!metadata) {
      return null;
    }

    return JSON.parse(metadata);
  } catch (error) {
    logger.error('Failed to get user metadata', { userId, error: error.message });
    throw new Error('Failed to retrieve user metadata from storage');
  }
}

/**
 * Delete user data from Redis
 * @param {string} userId User ID
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
async function deleteUserData(userId) {
  try {
    const redis = getRedis();
    const dataKey = `${KEY_PREFIX}${userId}${DATA_SUFFIX}`;
    const metadataKey = `${KEY_PREFIX}${userId}${METADATA_SUFFIX}`;

    const deleted = await redis.del(dataKey, metadataKey);

    logger.info('User data deleted', { userId, keysDeleted: deleted });

    return deleted > 0;
  } catch (error) {
    logger.error('Failed to delete user data', { userId, error: error.message });
    throw new Error('Failed to delete user data from storage');
  }
}

module.exports = {
  getUserData,
  saveUserData,
  getUserMetadata,
  deleteUserData
};
