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
    this._migrateData()
    this._notifyListeners()
  }

  /**
   * Migrate/normalize data structure to ensure all required fields exist
   */
  _migrateData() {
    let needsSave = false

    // Ensure groups array exists
    if (!this.data.groups) {
      this.data.groups = []
      needsSave = true
    }

    // Ensure tariffs array exists
    if (!this.data.tariffs) {
      this.data.tariffs = []
      needsSave = true
    }

    // Ensure settings object exists with all required fields
    if (!this.data.settings) {
      this.data.settings = {}
      needsSave = true
    }

    if (this.data.settings.dashboardWidgets === undefined) {
      this.data.settings.dashboardWidgets = []
      needsSave = true
    }

    // Save if any migrations were needed
    if (needsSave) {
      this._scheduleAutoSave()
    }
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

      // Ensure data structure is up-to-date
      this._migrateData()

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

  // ===== GROUPS =====

  /**
   * Add a new group
   */
  addGroup(name, description = '', icon = '🏠', color = '#3b82f6') {
    const group = {
      id: crypto.randomUUID(),
      name,
      description,
      icon,
      color,
      createdAt: new Date().toISOString()
    }

    this.data.groups.push(group)
    this._scheduleAutoSave()
    return group
  }

  /**
   * Update an existing group
   */
  updateGroup(id, updates) {
    const index = this.data.groups.findIndex(g => g.id === id)
    if (index === -1) {
      throw new Error('Group not found')
    }

    this.data.groups[index] = {
      ...this.data.groups[index],
      ...updates
    }
    this._scheduleAutoSave()
    return this.data.groups[index]
  }

  /**
   * Delete a group (meters in group become ungrouped)
   */
  deleteGroup(id) {
    // Unlink all meters from this group
    this.data.meters.forEach(meter => {
      if (meter.groupId === id) {
        meter.groupId = null
      }
    })

    this.data.groups = this.data.groups.filter(g => g.id !== id)
    this._scheduleAutoSave()
  }

  /**
   * Get all groups
   */
  getGroups() {
    return this.data.groups
  }

  /**
   * Get a single group by ID
   */
  getGroup(id) {
    return this.data.groups.find(g => g.id === id)
  }

  /**
   * Get all meters in a specific group
   */
  getMetersInGroup(groupId) {
    return this.data.meters.filter(m => m.groupId === groupId)
  }

  /**
   * Get all meters not assigned to any group
   */
  getUngroupedMeters() {
    return this.data.meters.filter(m => !m.groupId)
  }

  // ===== TARIFFS =====

  /**
   * Add a new tariff
   */
  addTariff(name, meterTypeId, pricePerUnit, baseCharge = 0, validFrom = null, validTo = null) {
    const tariff = {
      id: crypto.randomUUID(),
      name,
      meterTypeId,
      pricePerUnit: parseFloat(pricePerUnit),
      baseCharge: parseFloat(baseCharge),
      validFrom: validFrom || new Date().toISOString().split('T')[0],
      validTo,
      createdAt: new Date().toISOString()
    }

    this.data.tariffs.push(tariff)
    this._scheduleAutoSave()
    return tariff
  }

  /**
   * Update an existing tariff
   */
  updateTariff(id, updates) {
    const index = this.data.tariffs.findIndex(t => t.id === id)
    if (index === -1) {
      throw new Error('Tariff not found')
    }

    if (updates.pricePerUnit !== undefined) {
      updates.pricePerUnit = parseFloat(updates.pricePerUnit)
    }
    if (updates.baseCharge !== undefined) {
      updates.baseCharge = parseFloat(updates.baseCharge)
    }

    this.data.tariffs[index] = {
      ...this.data.tariffs[index],
      ...updates
    }
    this._scheduleAutoSave()
    return this.data.tariffs[index]
  }

  /**
   * Delete a tariff (unlinks from meters)
   */
  deleteTariff(id) {
    // Unlink all meters from this tariff
    this.data.meters.forEach(meter => {
      if (meter.tariffId === id) {
        meter.tariffId = null
      }
    })

    this.data.tariffs = this.data.tariffs.filter(t => t.id !== id)
    this._scheduleAutoSave()
  }

  /**
   * Get all tariffs
   */
  getTariffs() {
    return this.data.tariffs || []
  }

  /**
   * Get a single tariff by ID
   */
  getTariff(id) {
    return this.data.tariffs?.find(t => t.id === id)
  }

  /**
   * Get tariffs for a specific meter type
   */
  getTariffsForMeterType(meterTypeId) {
    return (this.data.tariffs || []).filter(t => t.meterTypeId === meterTypeId)
  }

  /**
   * Get the active tariff for a meter at a specific date
   */
  getActiveTariffForMeter(meterId, date = new Date()) {
    const meter = this.getMeter(meterId)
    if (!meter || !meter.tariffId) return null

    const tariff = this.getTariff(meter.tariffId)
    if (!tariff) return null

    const checkDate = typeof date === 'string' ? new Date(date) : date
    const tariffStart = new Date(tariff.validFrom)
    const tariffEnd = tariff.validTo ? new Date(tariff.validTo) : null

    if (checkDate >= tariffStart && (!tariffEnd || checkDate <= tariffEnd)) {
      return tariff
    }

    return null
  }

  // ===== COST CALCULATIONS =====

  /**
   * Calculate consumption between two readings
   */
  calculateConsumption(meterId, startDate = null, endDate = null) {
    const readings = this.getReadingsForMeter(meterId)
    if (readings.length < 2) return { consumption: 0, readings: [] }

    let filteredReadings = readings
    if (startDate) {
      const start = new Date(startDate)
      filteredReadings = filteredReadings.filter(r => new Date(r.timestamp) >= start)
    }
    if (endDate) {
      const end = new Date(endDate)
      filteredReadings = filteredReadings.filter(r => new Date(r.timestamp) <= end)
    }

    if (filteredReadings.length < 2) return { consumption: 0, readings: filteredReadings }

    const firstReading = filteredReadings[0]
    const lastReading = filteredReadings[filteredReadings.length - 1]
    const consumption = lastReading.value - firstReading.value

    return {
      consumption,
      readings: filteredReadings,
      startDate: firstReading.timestamp,
      endDate: lastReading.timestamp
    }
  }

  /**
   * Calculate cost for a meter in a date range
   */
  calculateCost(meterId, startDate = null, endDate = null) {
    const meter = this.getMeter(meterId)
    if (!meter) return { cost: 0, consumption: 0, tariff: null }

    const tariff = meter.tariffId ? this.getTariff(meter.tariffId) : null
    if (!tariff) return { cost: 0, consumption: 0, tariff: null, error: 'No tariff assigned' }

    const { consumption, startDate: actualStart, endDate: actualEnd } = this.calculateConsumption(meterId, startDate, endDate)

    // Calculate usage cost
    const usageCost = consumption * tariff.pricePerUnit

    // Calculate base charge (pro-rated if date range specified)
    let baseCharge = 0
    if (tariff.baseCharge > 0 && actualStart && actualEnd) {
      const start = new Date(actualStart)
      const end = new Date(actualEnd)
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
      const monthlyCharge = tariff.baseCharge
      baseCharge = (monthlyCharge / 30) * days
    }

    const totalCost = usageCost + baseCharge

    return {
      cost: totalCost,
      usageCost,
      baseCharge,
      consumption,
      tariff,
      startDate: actualStart,
      endDate: actualEnd,
      currency: this.data.settings?.currency || 'EUR'
    }
  }

  /**
   * Get monthly cost breakdown for a meter
   * Calculates consumption between consecutive readings and attributes
   * it to the month of the later reading
   */
  getMonthlyBreakdown(meterId, year = new Date().getFullYear()) {
    const readings = this.getReadingsForMeter(meterId)
    const meter = this.getMeter(meterId)
    const tariff = meter?.tariffId ? this.getTariff(meter.tariffId) : null

    // Initialize all months
    const months = []
    for (let month = 0; month < 12; month++) {
      months.push({
        month: month + 1,
        year,
        monthName: new Date(year, month, 1).toLocaleDateString('de-DE', { month: 'short' }),
        consumption: 0,
        cost: 0,
        readingsCount: 0
      })
    }

    // Count readings per month
    readings.forEach(r => {
      const date = new Date(r.timestamp)
      if (date.getFullYear() === year) {
        months[date.getMonth()].readingsCount++
      }
    })

    // Calculate consumption between consecutive readings
    // Attribute to month of the later reading
    for (let i = 1; i < readings.length; i++) {
      const prevReading = readings[i - 1]
      const currReading = readings[i]
      const currDate = new Date(currReading.timestamp)

      if (currDate.getFullYear() !== year) continue

      const consumption = currReading.value - prevReading.value
      if (consumption < 0) continue  // Skip meter resets

      const monthIndex = currDate.getMonth()
      months[monthIndex].consumption += consumption

      if (tariff) {
        months[monthIndex].cost += consumption * tariff.pricePerUnit
      }
    }

    // Add base charge to months with consumption
    if (tariff?.baseCharge > 0) {
      months.forEach(m => {
        if (m.consumption > 0) {
          m.cost += tariff.baseCharge
        }
      })
    }

    return months
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
  addMeter(name, typeId, meterNumber = '', location = '', isContinuous = false, groupId = null, tariffId = null) {
    const meter = {
      id: crypto.randomUUID(),
      name,
      typeId,
      meterNumber,
      location,
      isContinuous,
      groupId,
      tariffId,
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