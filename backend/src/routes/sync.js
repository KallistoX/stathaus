/**
 * Data Sync Routes
 *
 * Handles user data synchronization with Redis.
 */

const express = require('express');
const { getUserData, saveUserData, getUserMetadata } = require('../services/storageService');
const { requireAuth } = require('../middleware/auth');
const { validate, syncUploadSchema } = require('../utils/validation');
const { BadRequestError } = require('../utils/errors');

const router = express.Router();

/**
 * Upload user data
 * POST /api/sync/upload
 * Requires: Authorization header with Bearer token
 * Body: { meters: [], readings: [] }
 */
router.post('/upload', requireAuth, async (req, res, next) => {
  try {
    // Validate request body
    const validation = validate(req.body, syncUploadSchema);
    if (!validation.valid) {
      throw new BadRequestError(JSON.stringify(validation.errors));
    }

    const userId = req.user.id;
    const data = validation.value;

    // Save data to Redis
    const metadata = await saveUserData(userId, data);

    res.json({
      success: true,
      metadata
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Download user data
 * GET /api/sync/download
 * Requires: Authorization header with Bearer token
 */
router.get('/download', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get data from Redis
    const data = await getUserData(userId);

    if (!data) {
      // Return empty data structure if none exists
      return res.json({
        version: '1.0',
        meterTypes: [],
        meters: [],
        readings: [],
        settings: {},
        lastModified: null
      });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * Get sync metadata
 * GET /api/sync/metadata
 * Requires: Authorization header with Bearer token
 */
router.get('/metadata', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get metadata from Redis
    const metadata = await getUserMetadata(userId);

    if (!metadata) {
      return res.json({
        lastUpdated: null,
        metersCount: 0,
        readingsCount: 0,
        size: 0
      });
    }

    res.json(metadata);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
