/**
 * Health Check Routes
 *
 * Provides health status endpoints for Kubernetes probes.
 */

const express = require('express');
const { getRedis } = require('../redis');
const { getClient } = require('../oauth');
const config = require('../config');

const router = express.Router();

/**
 * Basic health check
 * GET /api/health
 */
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: config.app.version
  });
});

/**
 * Detailed readiness check
 * GET /api/health/ready
 */
router.get('/ready', async (req, res) => {
  const checks = {
    redis: false,
    oauth: false
  };

  try {
    // Check Redis
    const redis = getRedis();
    await redis.ping();
    checks.redis = true;

    // Check OAuth client
    const oauthClient = getClient();
    checks.oauth = !!oauthClient;

    const allReady = checks.redis && checks.oauth;

    res.status(allReady ? 200 : 503).json({
      status: allReady ? 'ready' : 'not ready',
      checks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      checks,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
