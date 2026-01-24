/**
 * CloudStorageAdapter
 *
 * Implements StorageAdapter interface for cloud sync via backend API.
 * Requires OAuth authentication.
 */

import { StorageAdapter } from '../storage/StorageAdapter.js';
import OAuthAuthService from '../services/OAuthAuthService.js';

export default class CloudStorageAdapter extends StorageAdapter {
  constructor() {
    super();
    this.authService = new OAuthAuthService();
    this.apiBaseUrl = window.location.origin;
  }

  /**
   * Get adapter name for display
   */
  getName() {
    return 'Cloud-Speicher';
  }

  /**
   * Check if cloud storage can be used (requires authentication)
   */
  async canUse() {
    return this.isAuthenticated();
  }

  /**
   * Initialize the adapter
   */
  async init() {
    if (!this.isAuthenticated()) {
      throw new Error('Nicht angemeldet. Cloud-Speicher erfordert Authentifizierung.');
    }
    return true;
  }

  /**
   * Load data from cloud storage
   * @returns {Promise<Object>} Full data structure
   */
  async load() {
    try {
      const response = await this.authService.authenticatedFetch(
        `${this.apiBaseUrl}/api/sync/download`
      );

      if (!response.ok) {
        throw new Error('Fehler beim Laden der Daten aus der Cloud');
      }

      const cloudData = await response.json();

      // If cloud is empty, return empty data structure
      if (!cloudData.meters?.length && !cloudData.readings?.length) {
        const emptyData = this._getEmptyData();
        emptyData.settings.storageMode = 'cloud';
        return emptyData;
      }

      // Merge cloud data into full data structure
      return {
        version: cloudData.version || '1.0',
        meterTypes: cloudData.meterTypes || [],
        meters: cloudData.meters || [],
        readings: cloudData.readings || [],
        groups: cloudData.groups || [],
        tariffs: cloudData.tariffs || [],
        settings: {
          ...this._getEmptyData().settings,
          storageMode: 'cloud',
          ...(cloudData.settings || {})
        },
        createdAt: cloudData.createdAt || new Date().toISOString(),
        lastModified: cloudData.lastModified || new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to load from cloud:', error);
      throw error;
    }
  }

  /**
   * Save data to cloud storage
   * @param {Object} data Full data structure
   * @returns {Promise<Object>} Response metadata
   */
  async save(data) {
    try {
      const response = await this.authService.authenticatedFetch(
        `${this.apiBaseUrl}/api/sync/upload`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            version: data.version,
            meterTypes: data.meterTypes,
            meters: data.meters,
            readings: data.readings,
            groups: data.groups || [],
            tariffs: data.tariffs || [],
            settings: data.settings,
            lastModified: new Date().toISOString()
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Fehler beim Speichern in der Cloud');
      }

      const result = await response.json();
      return result.metadata;
    } catch (error) {
      console.error('Failed to save to cloud:', error);
      throw error;
    }
  }

  // ===== AUTH HELPER METHODS =====

  /**
   * Check if user is authenticated
   * @returns {boolean} True if authenticated
   */
  isAuthenticated() {
    return this.authService.isLoggedIn();
  }

  /**
   * Try to restore session using refresh token if access token is expired
   * @returns {Promise<boolean>} True if session was restored
   */
  async tryRestoreSession() {
    const refreshToken = localStorage.getItem('oauth_refresh_token');
    const expiresAt = localStorage.getItem('oauth_expires_at');

    // No refresh token available
    if (!refreshToken) {
      return false;
    }

    // Token is not expired yet, already authenticated
    if (expiresAt && Date.now() < parseInt(expiresAt)) {
      return true;
    }

    // Token is expired, try to refresh
    try {
      await this.authService.refreshToken();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current user information
   * @returns {Promise<Object>} User info
   */
  async getUserInfo() {
    return this.authService.getUserInfo();
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
   * Sync all data to cloud (convenience method)
   * @param {Array} meters All meters
   * @param {Array} readings All readings
   * @returns {Promise<Object>} Sync metadata
   */
  async syncAll(meters, readings) {
    return this.save({
      version: '1.0',
      meterTypes: [],
      meters,
      readings,
      settings: { storageMode: 'cloud' }
    });
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
