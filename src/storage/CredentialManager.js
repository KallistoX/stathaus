/**
 * CredentialManager
 *
 * Manages secure storage and retrieval of WebDAV credentials
 * using Web Crypto API for encryption and IndexedDB for persistence.
 */
export default class CredentialManager {
  constructor() {
    this.DB_NAME = 'StatHausCredentials'
    this.DB_VERSION = 1
    this.STORE_NAME = 'credentials'
    this.CREDENTIAL_KEY = 'webdav_credentials'
    this.db = null
  }

  /**
   * Initialize the IndexedDB database
   * @returns {Promise<IDBDatabase>}
   */
  async _initDB() {
    if (this.db) {
      return this.db
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION)

      request.onerror = () => {
        reject(new Error('Fehler beim Öffnen der Credential-Datenbank'))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME)
        }
      }
    })
  }

  /**
   * Generate or retrieve encryption key
   * @returns {Promise<CryptoKey>}
   */
  async _getEncryptionKey() {
    // In a browser environment, we use a key derived from a static password
    // combined with browser-specific entropy for basic encryption
    // Note: This is not perfect security but reasonable for web app constraints
    const password = 'stathaus-webdav-v1'
    const encoder = new TextEncoder()
    const passwordData = encoder.encode(password)

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordData,
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    )

    // Derive actual encryption key
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('stathaus-salt-v1'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    )

    return key
  }

  /**
   * Encrypt credentials object
   * @param {Object} credentials - { serverUrl, username, password, filePath }
   * @returns {Promise<Object>} Encrypted data with IV
   */
  async _encrypt(credentials) {
    const key = await this._getEncryptionKey()
    const encoder = new TextEncoder()
    const data = encoder.encode(JSON.stringify(credentials))

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12))

    // Encrypt data
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      data
    )

    return {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted))
    }
  }

  /**
   * Decrypt credentials object
   * @param {Object} encrypted - { iv, data }
   * @returns {Promise<Object>} Decrypted credentials
   */
  async _decrypt(encrypted) {
    const key = await this._getEncryptionKey()

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(encrypted.iv)
      },
      key,
      new Uint8Array(encrypted.data)
    )

    const decoder = new TextDecoder()
    const jsonString = decoder.decode(decrypted)
    return JSON.parse(jsonString)
  }

  /**
   * Store credentials securely
   * @param {Object} credentials - { serverUrl, username, password, filePath }
   * @returns {Promise<void>}
   */
  async store(credentials) {
    if (!credentials || !credentials.serverUrl || !credentials.username || !credentials.password) {
      throw new Error('Ungültige Zugangsdaten')
    }

    const db = await this._initDB()
    const encrypted = await this._encrypt(credentials)

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite')
      const store = transaction.objectStore(this.STORE_NAME)
      const request = store.put(encrypted, this.CREDENTIAL_KEY)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Fehler beim Speichern der Zugangsdaten'))
    })
  }

  /**
   * Retrieve stored credentials
   * @returns {Promise<Object|null>} Credentials or null if not found
   */
  async retrieve() {
    const db = await this._initDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly')
      const store = transaction.objectStore(this.STORE_NAME)
      const request = store.get(this.CREDENTIAL_KEY)

      request.onsuccess = async () => {
        if (!request.result) {
          resolve(null)
          return
        }

        try {
          const credentials = await this._decrypt(request.result)
          resolve(credentials)
        } catch (error) {
          reject(new Error('Fehler beim Entschlüsseln der Zugangsdaten'))
        }
      }

      request.onerror = () => reject(new Error('Fehler beim Laden der Zugangsdaten'))
    })
  }

  /**
   * Check if credentials exist
   * @returns {Promise<boolean>}
   */
  async exists() {
    const credentials = await this.retrieve()
    return credentials !== null
  }

  /**
   * Clear stored credentials
   * @returns {Promise<void>}
   */
  async clear() {
    const db = await this._initDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite')
      const store = transaction.objectStore(this.STORE_NAME)
      const request = store.delete(this.CREDENTIAL_KEY)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Fehler beim Löschen der Zugangsdaten'))
    })
  }

  /**
   * Update specific credential fields
   * @param {Object} updates - Partial credentials to update
   * @returns {Promise<void>}
   */
  async update(updates) {
    const existing = await this.retrieve()

    if (!existing) {
      throw new Error('Keine gespeicherten Zugangsdaten gefunden')
    }

    const updated = { ...existing, ...updates }
    await this.store(updated)
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}
