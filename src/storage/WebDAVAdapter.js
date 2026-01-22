import { StorageAdapter } from './StorageAdapter.js'
import { createClient } from 'webdav'
import CredentialManager from './CredentialManager.js'

/**
 * Storage adapter using WebDAV protocol
 * Provides cloud synchronization with Nextcloud, ownCloud, and other WebDAV servers
 */
export class WebDAVAdapter extends StorageAdapter {
  constructor() {
    super()
    this.client = null
    this.credentialManager = new CredentialManager()
    this.config = {
      serverUrl: null,
      username: null,
      password: null,
      filePath: '/StatHaus/stathaus-data.json'
    }
    this.saveInProgress = false
    this.retryCount = 0
    this.maxRetries = 3
    this.retryDelay = 1000 // Start with 1 second
  }

  getName() {
    if (this.config.serverUrl) {
      const url = new URL(this.config.serverUrl)
      return `WebDAV: ${url.hostname}${this.config.filePath}`
    }
    return 'WebDAV Cloud-Sync (nicht konfiguriert)'
  }

  async canUse() {
    // WebDAV works everywhere that supports fetch API (all modern browsers)
    return true
  }

  /**
   * Configure the WebDAV connection
   * @param {string} serverUrl - WebDAV server URL
   * @param {string} username - Username
   * @param {string} password - Password or app password
   * @param {string} filePath - Path to the data file
   */
  async configure(serverUrl, username, password, filePath = '/StatHaus/stathaus-data.json') {
    // Clean up server URL
    let cleanUrl = serverUrl.trim()
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl
    }
    cleanUrl = cleanUrl.replace(/\/$/, '') // Remove trailing slash

    this.config = {
      serverUrl: cleanUrl,
      username: username.trim(),
      password: password,
      filePath: filePath.trim()
    }

    // Store credentials securely
    await this.credentialManager.store(this.config)

    // Initialize WebDAV client
    this._initClient()
  }

  /**
   * Initialize WebDAV client with current config
   */
  _initClient() {
    if (!this.config.serverUrl || !this.config.username || !this.config.password) {
      throw new Error('WebDAV nicht konfiguriert')
    }

    this.client = createClient(this.config.serverUrl, {
      username: this.config.username,
      password: this.config.password
    })
  }

  async init() {
    // Try to restore credentials from storage
    const storedCredentials = await this.credentialManager.retrieve()

    if (storedCredentials) {
      this.config = storedCredentials
      this._initClient()

      // Test connection
      try {
        await this._testConnection()
        return {
          initialized: true,
          configured: true
        }
      } catch (error) {
        console.error('WebDAV connection test failed:', error)
        return {
          initialized: true,
          configured: true,
          connectionError: error.message
        }
      }
    }

    return {
      initialized: false,
      configured: false
    }
  }

  /**
   * Test WebDAV connection
   */
  async _testConnection() {
    if (!this.client) {
      throw new Error('WebDAV Client nicht initialisiert')
    }

    try {
      // Try to check if file exists (this tests authentication)
      await this.client.exists(this.config.filePath)
      return true
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          throw new Error('Authentifizierung fehlgeschlagen. Bitte überprüfe deine Zugangsdaten.')
        }
        if (error.response.status === 404) {
          // File doesn't exist yet - that's okay
          return true
        }
      }
      throw new Error('Verbindung zum WebDAV-Server fehlgeschlagen: ' + error.message)
    }
  }

  /**
   * Load data from WebDAV server
   */
  async load() {
    if (!this.client) {
      throw new Error('WebDAV Client nicht initialisiert')
    }

    try {
      console.log('WebDAVAdapter: Loading file from', this.config.filePath)

      // Check if file exists
      const exists = await this.client.exists(this.config.filePath)

      if (!exists) {
        console.log('WebDAVAdapter: File does not exist, returning empty data')
        return this._getEmptyData()
      }

      // Download file content
      const content = await this.client.getFileContents(this.config.filePath, {
        format: 'text'
      })

      console.log('WebDAVAdapter: File content loaded, length:', content.length)

      try {
        const data = JSON.parse(content)
        console.log('WebDAVAdapter: Loaded data:', {
          meters: data.meters?.length || 0,
          readings: data.readings?.length || 0,
          meterTypes: data.meterTypes?.length || 0
        })
        return data
      } catch (error) {
        console.error('WebDAVAdapter: Invalid JSON in file')
        throw new Error('Ungültiges Dateiformat auf dem Server')
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          throw new Error('Authentifizierung fehlgeschlagen. Bitte melde dich erneut an.')
        }
        if (error.response.status === 404) {
          // File not found - return empty data
          console.log('WebDAVAdapter: File not found (404), returning empty data')
          return this._getEmptyData()
        }
      }
      throw error
    }
  }

  /**
   * Save data to WebDAV server with retry logic
   */
  async save(data) {
    if (!this.client) {
      throw new Error('WebDAV Client nicht initialisiert')
    }

    if (this.saveInProgress) {
      console.log('WebDAVAdapter: Save already in progress, skipping')
      return
    }

    this.saveInProgress = true

    try {
      // Update timestamp
      data.lastModified = new Date().toISOString()

      console.log('WebDAVAdapter: Saving data:', {
        meters: data.meters?.length || 0,
        readings: data.readings?.length || 0,
        meterTypes: data.meterTypes?.length || 0
      })

      await this._saveWithRetry(data)

      console.log('WebDAVAdapter: Save completed')
      this.retryCount = 0 // Reset retry count on success
    } finally {
      this.saveInProgress = false
    }
  }

  /**
   * Save with exponential backoff retry logic
   */
  async _saveWithRetry(data, attempt = 0) {
    try {
      // Ensure parent directory exists
      await this._ensureDirectoryExists()

      // Upload file content
      await this.client.putFileContents(
        this.config.filePath,
        JSON.stringify(data, null, 2),
        {
          contentLength: false,
          overwrite: true
        }
      )
    } catch (error) {
      console.error(`WebDAVAdapter: Save attempt ${attempt + 1} failed:`, error)

      // Check if we should retry
      if (attempt < this.maxRetries && this._isRetryableError(error)) {
        const delay = this.retryDelay * Math.pow(2, attempt) // Exponential backoff
        console.log(`WebDAVAdapter: Retrying in ${delay}ms...`)
        await this._sleep(delay)
        return this._saveWithRetry(data, attempt + 1)
      }

      // Max retries reached or non-retryable error
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          throw new Error('Authentifizierung fehlgeschlagen. Bitte melde dich erneut an.')
        }
        if (error.response.status === 507) {
          throw new Error('Nicht genügend Speicherplatz auf dem Server.')
        }
      }

      throw new Error('Fehler beim Speichern auf dem Server: ' + error.message)
    }
  }

  /**
   * Check if error is retryable (network errors, temporary server issues)
   */
  _isRetryableError(error) {
    // Network errors (no response)
    if (!error.response) {
      return true
    }

    // Server errors that might be temporary
    const status = error.response.status
    return status === 500 || status === 502 || status === 503 || status === 504
  }

  /**
   * Ensure parent directory exists
   */
  async _ensureDirectoryExists() {
    const directory = this.config.filePath.substring(0, this.config.filePath.lastIndexOf('/'))

    if (!directory) {
      return // Root directory
    }

    try {
      const exists = await this.client.exists(directory)
      if (!exists) {
        console.log('WebDAVAdapter: Creating directory', directory)
        await this.client.createDirectory(directory, { recursive: true })
      }
    } catch (error) {
      console.error('WebDAVAdapter: Error creating directory:', error)
      // Don't throw - let the save attempt fail with a more specific error
    }
  }

  /**
   * Sleep utility for retry delays
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Check for conflicts with remote version
   * @returns {Promise<{hasConflict: boolean, remoteModified: string|null}>}
   */
  async checkForConflicts(localLastModified) {
    if (!this.client) {
      return { hasConflict: false, remoteModified: null }
    }

    try {
      // Load remote data
      const remoteData = await this.load()

      if (!remoteData.lastModified) {
        return { hasConflict: false, remoteModified: null }
      }

      const remoteTime = new Date(remoteData.lastModified).getTime()
      const localTime = new Date(localLastModified).getTime()

      // Conflict if remote is newer than local
      const hasConflict = remoteTime > localTime

      return {
        hasConflict,
        remoteModified: remoteData.lastModified,
        remoteData: hasConflict ? remoteData : null
      }
    } catch (error) {
      console.error('WebDAVAdapter: Error checking for conflicts:', error)
      return { hasConflict: false, remoteModified: null }
    }
  }

  /**
   * Clear stored configuration and credentials
   */
  async clearConfiguration() {
    await this.credentialManager.clear()
    this.config = {
      serverUrl: null,
      username: null,
      password: null,
      filePath: '/StatHaus/stathaus-data.json'
    }
    this.client = null
  }

  /**
   * Get connection status
   */
  async getStatus() {
    if (!this.client) {
      return {
        connected: false,
        serverUrl: null,
        username: null
      }
    }

    try {
      await this._testConnection()
      return {
        connected: true,
        serverUrl: this.config.serverUrl,
        username: this.config.username,
        filePath: this.config.filePath
      }
    } catch (error) {
      return {
        connected: false,
        serverUrl: this.config.serverUrl,
        username: this.config.username,
        error: error.message
      }
    }
  }
}
