import { StorageAdapter } from './StorageAdapter.js'

/**
 * Storage adapter using IndexedDB for browser-based storage
 */
export class IndexedDBAdapter extends StorageAdapter {
  constructor() {
    super()
    this.dbName = 'StatHausDB'
    this.dbVersion = 1
    this.storeName = 'appData'
    this.db = null
  }

  getName() {
    return 'Browser-Speicher (IndexedDB)'
  }

  async canUse() {
    return 'indexedDB' in window
  }

  async init() {
    if (this.db) return this.db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => {
        console.error('IndexedDB error:', request.error)
        reject(new Error('Fehler beim Öffnen der Datenbank'))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName)
        }
      }
    })
  }

  async load() {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get('data')

      request.onsuccess = () => {
        const data = request.result || this._getEmptyData()
        resolve(data)
      }

      request.onerror = () => {
        console.error('Error loading data:', request.error)
        reject(new Error('Fehler beim Laden der Daten'))
      }
    })
  }

  async save(data) {
    await this.init()

    // Deep clone to remove any reactive proxies or non-serializable objects
    const cleanData = JSON.parse(JSON.stringify(data))

    // Update timestamp
    cleanData.lastModified = new Date().toISOString()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.put(cleanData, 'data')

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        console.error('Error saving data:', request.error)
        reject(new Error('Fehler beim Speichern der Daten'))
      }
    })
  }

  /**
   * Clear all data (for testing/reset)
   */
  async clear() {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}