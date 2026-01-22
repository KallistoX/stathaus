import { IndexedDBAdapter } from './IndexedDBAdapter.js'

/**
 * Central data manager that handles all data operations
 * Supports auto-save, event listeners, and adapter switching
 */
export class DataManager {
  constructor(adapter) {
    this.adapter = adapter
    this.data = null
    this.autoSaveTimeout = null
    this.listeners = new Set()
    this.permissionErrorListeners = new Set()
    this.saveInProgress = false
    this.fallbackAdapter = null

    // Save before page unload to prevent data loss
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        // Use synchronous method if pending save exists
        if (this.autoSaveTimeout) {
          clearTimeout(this.autoSaveTimeout)
          // Force synchronous save on unload
          this._saveSync()
        }
      })
    }
  }

  /**
   * Initialize the data manager
   */
  async init() {
    await this.adapter.init()
    this.data = await this.adapter.load()
    this._notifyListeners()
  }

  /**
   * Switch to a different storage adapter
   * @param {StorageAdapter} newAdapter - The new adapter to switch to
   * @param {boolean} loadFromNew - If true, load data from new adapter instead of migrating
   * @param {boolean} skipInit - If true, skip adapter initialization (used when adapter is already initialized)
   */
  async switchAdapter(newAdapter, loadFromNew = false, skipInit = false) {
    // Initialize new adapter (unless already initialized)
    if (!skipInit) {
      await newAdapter.init()
    }

    if (loadFromNew) {
      // Load data from the new adapter (used when opening existing file)
      this.adapter = newAdapter
      this.data = await newAdapter.load()

      // Update storage mode in settings to match the adapter being used
      const expectedMode = newAdapter.constructor.name === 'FileSystemAdapter' ? 'filesystem' : 'indexeddb'
      const oldMode = this.data.settings.storageMode
      const modeChanged = oldMode !== expectedMode

      this.data.settings.storageMode = expectedMode

      if (modeChanged) {
        console.log(`DataManager: Updated storage mode from ${oldMode} to ${expectedMode}`)
        // Schedule save instead of immediate save to avoid blocking
        this._scheduleAutoSave()
      }
    } else {
      // Migrate data from current adapter to new adapter
      const exportedData = JSON.parse(JSON.stringify(this.data))

      // Update storage mode in settings
      exportedData.settings.storageMode =
        newAdapter.constructor.name === 'FileSystemAdapter' ? 'filesystem' : 'indexeddb'

      // Save to new adapter
      await newAdapter.save(exportedData)

      // Switch
      this.adapter = newAdapter
      this.data = exportedData
    }

    this._notifyListeners()
  }

  // ===== METER TYPES =====

  /**
   * Add a new meter type
   */
  addMeterType(name, unit, icon = '📊') {
    const meterType = {
      id: crypto.randomUUID(),
      name,
      unit,
      icon,
      createdAt: new Date().toISOString()
    }

    this.data.meterTypes.push(meterType)
    this._scheduleAutoSave()
    return meterType
  }

  /**
   * Update an existing meter type
   */
  updateMeterType(id, updates) {
    const index = this.data.meterTypes.findIndex(mt => mt.id === id)
    if (index === -1) {
      throw new Error('Meter type not found')
    }

    this.data.meterTypes[index] = {
      ...this.data.meterTypes[index],
      ...updates
    }
    this._scheduleAutoSave()
    return this.data.meterTypes[index]
  }

  /**
   * Delete a meter type
   */
  deleteMeterType(id) {
    // Check if type is in use
    const inUse = this.data.meters.some(m => m.typeId === id)
    if (inUse) {
      throw new Error('Zählertyp wird noch verwendet')
    }

    this.data.meterTypes = this.data.meterTypes.filter(mt => mt.id !== id)
    this._scheduleAutoSave()
  }

  /**
   * Get all meter types
   */
  getMeterTypes() {
    return this.data.meterTypes
  }

  // ===== METERS =====

  /**
   * Add a new meter
   */
  addMeter(name, typeId, meterNumber = '', location = '') {
    const meter = {
      id: crypto.randomUUID(),
      name,
      typeId,
      meterNumber,
      location,
      createdAt: new Date().toISOString()
    }

    this.data.meters.push(meter)
    this._scheduleAutoSave()
    return meter
  }

  /**
   * Update an existing meter
   */
  updateMeter(id, updates) {
    const index = this.data.meters.findIndex(m => m.id === id)
    if (index === -1) {
      throw new Error('Meter not found')
    }

    this.data.meters[index] = {
      ...this.data.meters[index],
      ...updates
    }
    this._scheduleAutoSave()
    return this.data.meters[index]
  }

  /**
   * Delete a meter and all its readings
   */
  deleteMeter(id) {
    this.data.meters = this.data.meters.filter(m => m.id !== id)
    this.data.readings = this.data.readings.filter(r => r.meterId !== id)
    this._scheduleAutoSave()
  }

  /**
   * Get all meters
   */
  getMeters() {
    return this.data.meters
  }

  /**
   * Get a single meter by ID
   */
  getMeter(id) {
    return this.data.meters.find(m => m.id === id)
  }

  /**
   * Get meter with type information
   */
  getMeterWithType(id) {
    const meter = this.getMeter(id)
    if (!meter) return null

    const type = this.data.meterTypes.find(t => t.id === meter.typeId)
    return { ...meter, type }
  }

  // ===== READINGS =====

  /**
   * Add a new reading
   */
  addReading(meterId, value, timestamp = null, note = '', photo = null) {
    const reading = {
      id: crypto.randomUUID(),
      meterId,
      value: parseFloat(value),
      timestamp: timestamp || new Date().toISOString(),
      note,
      photo
    }

    this.data.readings.push(reading)
    this._scheduleAutoSave()
    return reading
  }

  /**
   * Update an existing reading
   */
  updateReading(id, updates) {
    const index = this.data.readings.findIndex(r => r.id === id)
    if (index === -1) {
      throw new Error('Reading not found')
    }

    this.data.readings[index] = {
      ...this.data.readings[index],
      ...updates,
      value: parseFloat(updates.value)
    }
    this._scheduleAutoSave()
    return this.data.readings[index]
  }

  /**
   * Delete a reading
   */
  deleteReading(id) {
    this.data.readings = this.data.readings.filter(r => r.id !== id)
    this._scheduleAutoSave()
  }

  /**
   * Get all readings for a specific meter (sorted by timestamp)
   */
  getReadingsForMeter(meterId) {
    return this.data.readings
      .filter(r => r.meterId === meterId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  }

  /**
   * Get latest reading for a meter
   */
  getLatestReading(meterId) {
    const readings = this.getReadingsForMeter(meterId)
    return readings.length > 0 ? readings[readings.length - 1] : null
  }

  // ===== SETTINGS =====

  /**
   * Update settings
   */
  updateSettings(updates) {
    this.data.settings = {
      ...this.data.settings,
      ...updates
    }
    this._scheduleAutoSave()
  }

  /**
   * Get settings
   */
  getSettings() {
    return this.data.settings
  }

  // ===== EXPORT / IMPORT =====

  /**
   * Export data as JSON file
   */
  exportAsJSON() {
    const dataStr = JSON.stringify(this.data, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `stathaus_backup_${new Date().toISOString().split('T')[0]}.json`
    a.click()

    URL.revokeObjectURL(url)
  }

  /**
   * Import data from JSON file
   */
  async importFromJSON(file) {
    const text = await file.text()
    const importedData = JSON.parse(text)

    // Basic validation
    if (!importedData.version || !importedData.meters || !importedData.readings) {
      throw new Error('Ungültiges Datenformat')
    }

    this.data = importedData
    await this.saveNow()
  }

  /**
   * Export data as CSV (for Excel, etc.)
   */
  exportAsCSV() {
    const rows = []
    
    // Header
    rows.push(['Datum', 'Zähler', 'Typ', 'Einheit', 'Zählerstand', 'Notiz'])

    // Data rows
    this.data.readings.forEach(reading => {
      const meter = this.getMeter(reading.meterId)
      const type = this.data.meterTypes.find(t => t.id === meter?.typeId)
      
      if (meter && type) {
        rows.push([
          new Date(reading.timestamp).toLocaleDateString('de-DE'),
          meter.name,
          type.name,
          type.unit,
          reading.value,
          reading.note || ''
        ])
      }
    })

    // Convert to CSV
    const csv = rows.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n')

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `stathaus_export_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    
    URL.revokeObjectURL(url)
  }

  // ===== EVENT LISTENERS =====

  /**
   * Register a change listener
   * @returns Unsubscribe function
   */
  onChange(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  /**
   * Notify all listeners of data changes
   */
  _notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.data)
      } catch (error) {
        console.error('Error in change listener:', error)
      }
    })
  }

  // ===== SAVING =====

  /**
   * Schedule auto-save with debouncing
   */
  _scheduleAutoSave() {
    clearTimeout(this.autoSaveTimeout)
    this.autoSaveTimeout = setTimeout(async () => {
      await this.saveNow()
    }, 100) // 100ms debounce - fast enough to catch before page close
  }

  /**
   * Save immediately without debouncing
   */
  async saveNow() {
    if (this.saveInProgress) return

    try {
      this.saveInProgress = true
      clearTimeout(this.autoSaveTimeout)
      await this.adapter.save(this.data)
      this._notifyListeners()
    } catch (error) {
      console.error('Error saving data:', error)

      // Check if this is a permission error
      if (this._isPermissionError(error)) {
        console.warn('Permission error detected, falling back to IndexedDB')
        await this._fallbackSave()
        this._notifyPermissionError(error)
        return // Don't throw - we saved to fallback
      }

      throw error
    } finally {
      this.saveInProgress = false
    }
  }

  /**
   * Check if an error is permission-related
   */
  _isPermissionError(error) {
    const message = error.message || ''
    return (
      message.includes('Schreibberechtigung') ||
      message.includes('Leseberechtigung') ||
      message.includes('permission') ||
      error.name === 'NotAllowedError' ||
      error.name === 'SecurityError'
    )
  }

  /**
   * Save to IndexedDB as a fallback when file system permission fails
   */
  async _fallbackSave() {
    try {
      if (!this.fallbackAdapter) {
        this.fallbackAdapter = new IndexedDBAdapter()
        await this.fallbackAdapter.init()
      }
      await this.fallbackAdapter.save(this.data)
      console.log('Data saved to IndexedDB fallback')
    } catch (fallbackError) {
      console.error('Fallback save to IndexedDB also failed:', fallbackError)
      throw fallbackError
    }
  }

  /**
   * Register a permission error listener
   * @returns Unsubscribe function
   */
  onPermissionError(callback) {
    this.permissionErrorListeners.add(callback)
    return () => this.permissionErrorListeners.delete(callback)
  }

  /**
   * Notify permission error listeners
   */
  _notifyPermissionError(error) {
    this.permissionErrorListeners.forEach(callback => {
      try {
        callback(error)
      } catch (err) {
        console.error('Error in permission error listener:', err)
      }
    })
  }

  /**
   * Synchronous save for page unload (uses synchronous IndexedDB)
   * Note: This is a last resort - the async saves should normally complete
   */
  _saveSync() {
    if (!this.data || !this.adapter.db) return

    try {
      this.data.lastModified = new Date().toISOString()
      const transaction = this.adapter.db.transaction([this.adapter.storeName], 'readwrite')
      const store = transaction.objectStore(this.adapter.storeName)
      store.put(this.data, 'data')
    } catch (error) {
      console.error('Error in sync save:', error)
    }
  }

  // ===== UTILITY =====

  /**
   * Get storage adapter name
   */
  getStorageName() {
    return this.adapter.getName()
  }

  /**
   * Get all data (for debugging)
   */
  getAllData() {
    return this.data
  }
}