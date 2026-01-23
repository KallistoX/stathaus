/**
 * CloudStorageAdapter
 *
 * Implements StorageAdapter interface for cloud sync via backend API.
 * Requires OAuth authentication.
 */

import OAuthAuthService from '../services/OAuthAuthService.js';

export default class CloudStorageAdapter {
  constructor() {
    this.authService = new OAuthAuthService();
    this.apiBaseUrl = window.location.origin;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if authenticated
   */
  isAuthenticated() {
    return this.authService.isLoggedIn();
  }

  /**
   * Get current user information
   * @returns {Promise<Object>} User info
   */
  async getUserInfo() {
    return this.authService.getUserInfo();
  }

  /**
   * Load all meters from cloud storage
   * @returns {Promise<Array>} Array of meters
   */
  async loadMeters() {
    try {
      const response = await this.authService.authenticatedFetch(
        `${this.apiBaseUrl}/api/sync/download`
      );

      if (!response.ok) {
        throw new Error('Failed to download data from cloud');
      }

      const data = await response.json();
      return data.meters || [];
    } catch (error) {
      console.error('Failed to load meters from cloud:', error);
      throw error;
    }
  }

  /**
   * Load all readings from cloud storage
   * @returns {Promise<Array>} Array of readings
   */
  async loadReadings() {
    try {
      const response = await this.authService.authenticatedFetch(
        `${this.apiBaseUrl}/api/sync/download`
      );

      if (!response.ok) {
        throw new Error('Failed to download data from cloud');
      }

      const data = await response.json();
      return data.readings || [];
    } catch (error) {
      console.error('Failed to load readings from cloud:', error);
      throw error;
    }
  }

  /**
   * Save a meter to cloud storage
   * @param {Object} meter Meter object
   * @returns {Promise<Object>} Saved meter
   */
  async saveMeter(meter) {
    // Cloud storage saves full dataset, not individual items
    // This method should be called as part of a full sync
    throw new Error('CloudStorageAdapter requires full dataset sync. Use syncAll() instead.');
  }

  /**
   * Update a meter in cloud storage
   * @param {Object} meter Meter object
   * @returns {Promise<Object>} Updated meter
   */
  async updateMeter(meter) {
    // Cloud storage saves full dataset, not individual items
    throw new Error('CloudStorageAdapter requires full dataset sync. Use syncAll() instead.');
  }

  /**
   * Delete a meter from cloud storage
   * @param {string} meterId Meter ID
   * @returns {Promise<void>}
   */
  async deleteMeter(meterId) {
    // Cloud storage saves full dataset, not individual items
    throw new Error('CloudStorageAdapter requires full dataset sync. Use syncAll() instead.');
  }

  /**
   * Save a reading to cloud storage
   * @param {Object} reading Reading object
   * @returns {Promise<Object>} Saved reading
   */
  async saveReading(reading) {
    // Cloud storage saves full dataset, not individual items
    throw new Error('CloudStorageAdapter requires full dataset sync. Use syncAll() instead.');
  }

  /**
   * Update a reading in cloud storage
   * @param {Object} reading Reading object
   * @returns {Promise<Object>} Updated reading
   */
  async updateReading(reading) {
    // Cloud storage saves full dataset, not individual items
    throw new Error('CloudStorageAdapter requires full dataset sync. Use syncAll() instead.');
  }

  /**
   * Delete a reading from cloud storage
   * @param {string} readingId Reading ID
   * @returns {Promise<void>}
   */
  async deleteReading(readingId) {
    // Cloud storage saves full dataset, not individual items
    throw new Error('CloudStorageAdapter requires full dataset sync. Use syncAll() instead.');
  }

  /**
   * Sync all data to cloud
   * This is the primary method for cloud storage
   * @param {Array} meters All meters
   * @param {Array} readings All readings
   * @returns {Promise<Object>} Sync metadata
   */
  async syncAll(meters, readings) {
    try {
      const response = await this.authService.authenticatedFetch(
        `${this.apiBaseUrl}/api/sync/upload`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            meters,
            readings
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload data to cloud');
      }

      const result = await response.json();
      console.log('Data synced to cloud:', result.metadata);

      return result.metadata;
    } catch (error) {
      console.error('Failed to sync data to cloud:', error);
      throw error;
    }
  }

  /**
   * Get sync metadata
   * @returns {Promise<Object>} Metadata (lastUpdated, metersCount, readingsCount, size)
   */
  async getMetadata() {
    try {
      const response = await this.authService.authenticatedFetch(
        `${this.apiBaseUrl}/api/sync/metadata`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch sync metadata');
      }

      return response.json();
    } catch (error) {
      console.error('Failed to get sync metadata:', error);
      throw error;
    }
  }

  /**
   * Download all data from cloud
   * @returns {Promise<Object>} Object with meters and readings
   */
  async downloadAll() {
    try {
      const response = await this.authService.authenticatedFetch(
        `${this.apiBaseUrl}/api/sync/download`
      );

      if (!response.ok) {
        throw new Error('Failed to download data from cloud');
      }

      const data = await response.json();

      return {
        meters: data.meters || [],
        readings: data.readings || []
      };
    } catch (error) {
      console.error('Failed to download data from cloud:', error);
      throw error;
    }
  }

  /**
   * Check if cloud has newer data than local
   * @param {number} localTimestamp Local last updated timestamp
   * @returns {Promise<boolean>} True if cloud is newer
   */
  async hasNewerData(localTimestamp) {
    try {
      const metadata = await this.getMetadata();

      if (!metadata.lastUpdated) {
        return false; // No cloud data exists
      }

      return metadata.lastUpdated > localTimestamp;
    } catch (error) {
      console.error('Failed to check for newer data:', error);
      return false;
    }
  }

  /**
   * Initialize OAuth flow
   * @returns {Promise<void>}
   */
  async login() {
    return this.authService.login();
  }

  /**
   * Handle OAuth callback
   * @param {string} code Authorization code
   * @param {string} state State parameter
   * @returns {Promise<Object>} Tokens
   */
  async handleCallback(code, state) {
    return this.authService.handleCallback(code, state);
  }

  /**
   * Logout and clear tokens
   * @returns {Promise<void>}
   */
  async logout() {
    return this.authService.logout();
  }
}
