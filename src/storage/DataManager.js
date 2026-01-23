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
    this.saveInProgress = false

    // Save before page unload to prevent data loss
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        if (this.autoSaveTimeout) {
          clearTimeout(this.autoSaveTimeout)
          // Attempt sync save for IndexedDB
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

    // Determine the storage mode based on adapter type
    const adapterName = newAdapter.constructor.name
    const expectedMode = adapterName === 'CloudStorageAdapter' ? 'cloud' : 'indexeddb'

    if (loadFromNew) {
      // Load data from the new adapter
      this.adapter = newAdapter
      this.data = await newAdapter.load()

      const oldMode = this.data.settings?.storageMode
      const modeChanged = oldMode !== expectedMode

      this.data.settings.storageMode = expectedMode

      if (modeChanged) {
        this._scheduleAutoSave()
      }
    } else {
      // Migrate data from current adapter to new adapter
      const exportedData = JSON.parse(JSON.stringify(this.data))
      exportedData.settings.storageMode = expectedMode

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
  addMeter(name, typeId, meterNumber = '', location = '', isContinuous = false) {
    const meter = {
      id: crypto.randomUUID(),
      name,
      typeId,
      meterNumber,
      location,
      isContinuous,
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
      this.data.lastModified = new Date().toISOString()
      await this.adapter.save(this.data)
      this._notifyListeners()
    } catch (error) {
      console.error('Error saving data:', error)
      throw error
    } finally {
      this.saveInProgress = false
    }
  }

  /**
   * Synchronous save for page unload (for IndexedDB only)
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