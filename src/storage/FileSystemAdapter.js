import { StorageAdapter } from './StorageAdapter.js'

/**
 * Storage adapter using File System Access API
 * Allows direct file storage (e.g., in Nextcloud, iCloud, etc.)
 */
export class FileSystemAdapter extends StorageAdapter {
  constructor() {
    super()
    this.fileHandle = null
    this.HANDLE_STORAGE_KEY = 'fileSystemHandle'
  }

  getName() {
    if (this.fileHandle) {
      return `Datei: ${this.fileHandle.name}`
    }
    return 'Dateisystem (nicht konfiguriert)'
  }

  async canUse() {
    return 'showOpenFilePicker' in window
  }

  async init() {
    // Try to restore previously saved file handle
    if (!this.fileHandle) {
      const result = await this._restoreFileHandle()
      return {
        initialized: this.fileHandle !== null,
        permissionState: result.permissionState
      }
    }
    // Already have a handle, get current permission state
    const permissionState = await this.getPermissionState()
    return {
      initialized: true,
      permissionState
    }
  }

  /**
   * Create a new file and initialize it with empty data
   */
  async createNewFile() {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'stathaus-zaehlerstaende.json',
        types: [{
          description: 'StatHaus Daten',
          accept: { 'application/json': ['.json'] }
        }]
      })

      this.fileHandle = handle
      await this._persistFileHandle()

      // Don't write data here - let switchAdapter handle it
      // This prevents double-writing and data loss

      return true
    } catch (error) {
      if (error.name === 'AbortError') {
        return false // User cancelled
      }
      throw error
    }
  }

  /**
   * Open an existing file
   */
  async openExistingFile() {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{
          description: 'StatHaus Daten',
          accept: { 'application/json': ['.json'] }
        }],
        multiple: false
      })

      this.fileHandle = handle
      await this._persistFileHandle()

      return true
    } catch (error) {
      if (error.name === 'AbortError') {
        return false // User cancelled
      }
      throw error
    }
  }

  async load() {
    if (!this.fileHandle) {
      throw new Error('Keine Datei ausgewählt')
    }

    try {
      // Request read permission
      const permission = await this.fileHandle.queryPermission({ mode: 'read' })
      if (permission !== 'granted') {
        const newPermission = await this.fileHandle.requestPermission({ mode: 'read' })
        if (newPermission !== 'granted') {
          throw new Error('Keine Leseberechtigung für die Datei')
        }
      }

      const file = await this.fileHandle.getFile()
      const content = await file.text()

      console.log('FileSystemAdapter: Loading file, content length:', content.length)
      console.log('FileSystemAdapter: File content preview:', content.substring(0, 500))

      try {
        const data = JSON.parse(content)
        console.log('FileSystemAdapter: Loaded data:', {
          meters: data.meters?.length || 0,
          readings: data.readings?.length || 0,
          meterTypes: data.meterTypes?.length || 0
        })
        console.log('FileSystemAdapter: Full data structure:', data)
        return data
      } catch (error) {
        console.error('FileSystemAdapter: Invalid JSON in file')
        throw new Error('Ungültiges Dateiformat')
      }
    } catch (error) {
      // Handle NotFoundError when file is deleted
      if (error.name === 'NotFoundError') {
        console.error('FileSystemAdapter: File was deleted or no longer exists')
        throw new Error('Die Datei wurde gelöscht oder ist nicht mehr verfügbar')
      }
      throw error
    }
  }

  async save(data) {
    if (!this.fileHandle) {
      throw new Error('Keine Datei ausgewählt')
    }

    // Request write permission
    const permission = await this.fileHandle.queryPermission({ mode: 'readwrite' })
    if (permission !== 'granted') {
      const newPermission = await this.fileHandle.requestPermission({ mode: 'readwrite' })
      if (newPermission !== 'granted') {
        throw new Error('Keine Schreibberechtigung für die Datei')
      }
    }

    // Update timestamp
    data.lastModified = new Date().toISOString()

    console.log('FileSystemAdapter: Saving data:', {
      meters: data.meters?.length || 0,
      readings: data.readings?.length || 0,
      meterTypes: data.meterTypes?.length || 0
    })

    const writable = await this.fileHandle.createWritable()
    await writable.write(JSON.stringify(data, null, 2))
    await writable.close()

    console.log('FileSystemAdapter: Save completed')
  }

  /**
   * Check if we have a valid file handle
   */
  hasFileHandle() {
    return this.fileHandle !== null
  }

  /**
   * Get current permission states without triggering browser prompts
   * @returns {Promise<{read: string, write: string, fileName: string|null}>}
   */
  async getPermissionState() {
    if (!this.fileHandle) {
      return { read: 'no-handle', write: 'no-handle', fileName: null }
    }

    try {
      const read = await this.fileHandle.queryPermission({ mode: 'read' })
      const write = await this.fileHandle.queryPermission({ mode: 'readwrite' })

      return {
        read,
        write,
        fileName: this.fileHandle.name
      }
    } catch (error) {
      console.error('Error querying permission state:', error)
      return { read: 'unknown', write: 'unknown', fileName: this.fileHandle?.name || null }
    }
  }

  /**
   * Request permission - MUST be called from a user gesture handler (click, etc.)
   * @param {string} mode - 'read' or 'readwrite'
   * @returns {Promise<'granted'|'denied'|'prompt'>}
   */
  async requestPermissionFromGesture(mode = 'readwrite') {
    if (!this.fileHandle) {
      throw new Error('No file handle available')
    }
    return await this.fileHandle.requestPermission({ mode })
  }

  /**
   * Close current file
   */
  async closeFile() {
    this.fileHandle = null
    await this._clearPersistedHandle()
  }

  /**
   * Persist file handle to IndexedDB for later restoration
   */
  async _persistFileHandle() {
    try {
      const db = await this._getHandleDB()
      const transaction = db.transaction(['handles'], 'readwrite')
      const store = transaction.objectStore('handles')
      
      await new Promise((resolve, reject) => {
        const request = store.put(this.fileHandle, this.HANDLE_STORAGE_KEY)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.warn('Could not persist file handle:', error)
    }
  }

  /**
   * Restore previously saved file handle from IndexedDB
   * @returns {Promise<{restored: boolean, permissionState: {read: string, write: string, fileName: string|null}}>}
   */
  async _restoreFileHandle() {
    try {
      const db = await this._getHandleDB()
      const transaction = db.transaction(['handles'], 'readonly')
      const store = transaction.objectStore('handles')

      const handle = await new Promise((resolve) => {
        const request = store.get(this.HANDLE_STORAGE_KEY)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => resolve(null)
      })

      if (!handle) {
        return {
          restored: false,
          permissionState: { read: 'no-handle', write: 'no-handle', fileName: null }
        }
      }

      // Query permission states without triggering prompt
      const read = await handle.queryPermission({ mode: 'read' })
      const write = await handle.queryPermission({ mode: 'readwrite' })

      // Only reject if explicitly denied
      if (read !== 'denied') {
        this.fileHandle = handle
        return {
          restored: true,
          permissionState: { read, write, fileName: handle.name }
        }
      }

      // Permission was denied - don't restore handle
      return {
        restored: false,
        permissionState: { read, write, fileName: handle.name }
      }
    } catch (error) {
      console.warn('Could not restore file handle:', error)
      this.fileHandle = null
      return {
        restored: false,
        permissionState: { read: 'unknown', write: 'unknown', fileName: null }
      }
    }
  }

  /**
   * Clear persisted handle from IndexedDB
   */
  async _clearPersistedHandle() {
    try {
      const db = await this._getHandleDB()
      const transaction = db.transaction(['handles'], 'readwrite')
      const store = transaction.objectStore('handles')
      
      await new Promise((resolve, reject) => {
        const request = store.delete(this.HANDLE_STORAGE_KEY)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.warn('Could not clear persisted handle:', error)
    }
  }

  /**
   * Get IndexedDB instance for handle persistence
   */
  async _getHandleDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('FileHandleStorage', 1)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains('handles')) {
          db.createObjectStore('handles')
        }
      }
    })
  }
}