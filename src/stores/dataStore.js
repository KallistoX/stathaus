import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { DataManager } from '@/storage/DataManager.js'
import { IndexedDBAdapter } from '@/storage/IndexedDBAdapter.js'
import CloudStorageAdapter from '@/adapters/CloudStorageAdapter.js'

export const useDataStore = defineStore('data', () => {
  // State
  const dataManager = ref(null)
  const isInitialized = ref(false)
  const isLoading = ref(false)
  const error = ref(null)
  const data = ref(null)
  const theme = ref('dark')

  // Sync state (for cloud storage)
  const syncStatus = ref('idle') // idle | syncing | synced | error | offline
  const syncError = ref(null)
  const lastSyncTime = ref(null)

  // Conflict resolution state
  const showConflictModal = ref(false)
  const conflictLocalData = ref(null)
  const conflictRemoteData = ref(null)
  const conflictResolve = ref(null)

  // Computed
  const storageMode = computed(() => {
    return data.value?.settings?.storageMode || 'indexeddb'
  })

  const storageName = computed(() => {
    return dataManager.value?.getStorageName() || 'Nicht initialisiert'
  })

  const meterTypes = computed(() => {
    return data.value?.meterTypes || []
  })

  const meters = computed(() => {
    return data.value?.meters || []
  })

  const metersWithTypes = computed(() => {
    return meters.value.map(meter => {
      const type = meterTypes.value.find(t => t.id === meter.typeId)
      return { ...meter, type }
    })
  })

  // Actions
  async function initialize() {
    if (isInitialized.value) return

    isLoading.value = true
    error.value = null

    try {
      // Check if user is authenticated for cloud storage
      const cloudAdapter = new CloudStorageAdapter()
      let adapter

      if (cloudAdapter.isAuthenticated()) {
        // User is logged in - use cloud storage
        adapter = cloudAdapter
      } else {
        // Use IndexedDB as default for non-authenticated users
        adapter = new IndexedDBAdapter()
      }

      dataManager.value = new DataManager(adapter)
      await dataManager.value.init()
      data.value = dataManager.value.getAllData()

      // Listen to data changes
      dataManager.value.onChange((newData) => {
        data.value = newData
      })

      // Restore theme preference
      const savedTheme = data.value?.settings?.theme || 'dark'
      setTheme(savedTheme)

      isInitialized.value = true
    } catch (err) {
      console.error('Error initializing data store:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Theme management
  function setTheme(newTheme) {
    theme.value = newTheme

    // Apply theme to document
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    // Persist theme preference
    if (dataManager.value) {
      updateSettings({ theme: newTheme })
    }
  }

  function toggleTheme() {
    const newTheme = theme.value === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  async function switchToCloud() {
    isLoading.value = true
    error.value = null

    try {
      const cloudAdapter = new CloudStorageAdapter()

      if (!cloudAdapter.isAuthenticated()) {
        throw new Error('Nicht angemeldet. Bitte zuerst anmelden.')
      }

      // Check for existing cloud data
      const cloudData = await cloudAdapter.load()
      const localData = data.value

      // Determine if there's a conflict
      const cloudHasData = (cloudData.meters?.length > 0 || cloudData.readings?.length > 0)
      const localHasData = (localData.meters?.length > 0 || localData.readings?.length > 0)

      if (cloudHasData && localHasData) {
        // Show conflict resolution modal
        return await handleCloudConflict(localData, cloudData, cloudAdapter)
      } else if (cloudHasData) {
        // Cloud has data, local is empty -> load from cloud
        await dataManager.value.switchAdapter(cloudAdapter, true)
        data.value = dataManager.value.getAllData()
      } else {
        // Local has data or both empty -> push to cloud
        await dataManager.value.switchAdapter(cloudAdapter, false)
      }

      syncStatus.value = 'synced'
      lastSyncTime.value = new Date().toISOString()

      return true
    } catch (err) {
      console.error('Error switching to cloud:', err)
      error.value = err.message
      syncError.value = err.message
      syncStatus.value = 'error'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function handleCloudConflict(localData, cloudData, cloudAdapter) {
    return new Promise((resolve) => {
      conflictLocalData.value = localData
      conflictRemoteData.value = cloudData
      showConflictModal.value = true

      conflictResolve.value = async (choice) => {
        showConflictModal.value = false

        if (choice === 'local') {
          // Push local to cloud (overwrite cloud)
          await dataManager.value.switchAdapter(cloudAdapter, false)
        } else if (choice === 'remote') {
          // Pull cloud data (overwrite local)
          await dataManager.value.switchAdapter(cloudAdapter, true)
          data.value = dataManager.value.getAllData()
        }

        conflictLocalData.value = null
        conflictRemoteData.value = null
        syncStatus.value = 'synced'
        lastSyncTime.value = new Date().toISOString()
        resolve(true)
      }
    })
  }

  function resolveConflictWithLocal() {
    if (conflictResolve.value) {
      conflictResolve.value('local')
    }
  }

  function resolveConflictWithRemote() {
    if (conflictResolve.value) {
      conflictResolve.value('remote')
    }
  }

  function cancelConflictResolution() {
    showConflictModal.value = false
    conflictLocalData.value = null
    conflictRemoteData.value = null
    if (conflictResolve.value) {
      conflictResolve.value(null)
    }
  }

  async function switchToIndexedDB(clearData = false) {
    isLoading.value = true
    error.value = null

    try {
      const idbAdapter = new IndexedDBAdapter()

      if (clearData) {
        // Initialize fresh IndexedDB without migrating data
        await idbAdapter.init()
        await idbAdapter.save(idbAdapter._getEmptyData())
        dataManager.value = new DataManager(idbAdapter)
        await dataManager.value.init()
        data.value = dataManager.value.getAllData()

        // Re-attach listener
        dataManager.value.onChange((newData) => {
          data.value = newData
        })
      } else {
        // Migrate current data to IndexedDB
        await dataManager.value.switchAdapter(idbAdapter)
      }

      syncStatus.value = 'idle'
      syncError.value = null
    } catch (err) {
      console.error('Error switching to IndexedDB:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }


  // Watch for data changes and update sync status
  watch(
    () => data.value,
    () => {
      if (storageMode.value === 'cloud' && syncStatus.value !== 'error') {
        syncStatus.value = 'syncing'

        // After save completes (DataManager handles the actual save)
        // we'll update to 'synced' - this is a simplified approach
        setTimeout(() => {
          if (syncStatus.value === 'syncing') {
            syncStatus.value = 'synced'
            lastSyncTime.value = new Date().toISOString()
          }
        }, 500)
      }
    },
    { deep: true }
  )

  // Listen for online/offline events
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      if (storageMode.value === 'cloud' && syncStatus.value === 'offline') {
        syncStatus.value = 'idle'
      }
    })

    window.addEventListener('offline', () => {
      if (storageMode.value === 'cloud') {
        syncStatus.value = 'offline'
      }
    })
  }

  // Meter Types
  function addMeterType(name, unit, icon) {
    return dataManager.value.addMeterType(name, unit, icon)
  }

  function updateMeterType(id, updates) {
    return dataManager.value.updateMeterType(id, updates)
  }

  function deleteMeterType(id) {
    return dataManager.value.deleteMeterType(id)
  }

  // Meters
  function addMeter(name, typeId, meterNumber, location) {
    return dataManager.value.addMeter(name, typeId, meterNumber, location)
  }

  function updateMeter(id, updates) {
    return dataManager.value.updateMeter(id, updates)
  }

  function deleteMeter(id) {
    return dataManager.value.deleteMeter(id)
  }

  function getMeter(id) {
    return dataManager.value.getMeter(id)
  }

  function getMeterWithType(id) {
    return dataManager.value.getMeterWithType(id)
  }

  // Readings
  function addReading(meterId, value, timestamp, note, photo) {
    return dataManager.value.addReading(meterId, value, timestamp, note, photo)
  }

  function updateReading(id, updates) {
    return dataManager.value.updateReading(id, updates)
  }

  function deleteReading(id) {
    return dataManager.value.deleteReading(id)
  }

  function getReadingsForMeter(meterId) {
    return dataManager.value.getReadingsForMeter(meterId)
  }

  function getLatestReading(meterId) {
    return dataManager.value.getLatestReading(meterId)
  }

  // Settings
  function updateSettings(updates) {
    return dataManager.value.updateSettings(updates)
  }

  // Export/Import
  function exportAsJSON() {
    return dataManager.value.exportAsJSON()
  }

  function exportAsCSV() {
    return dataManager.value.exportAsCSV()
  }

  async function importFromJSON(file) {
    isLoading.value = true
    error.value = null

    try {
      await dataManager.value.importFromJSON(file)
    } catch (err) {
      console.error('Error importing data:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    isInitialized,
    isLoading,
    error,
    data,
    storageMode,
    storageName,
    meterTypes,
    meters,
    metersWithTypes,
    theme,

    // Sync State
    syncStatus,
    syncError,
    lastSyncTime,

    // Conflict Resolution State
    showConflictModal,
    conflictLocalData,
    conflictRemoteData,

    // Actions
    initialize,
    switchToCloud,
    switchToIndexedDB,

    // Theme
    setTheme,
    toggleTheme,

    // Conflict Resolution Handlers
    resolveConflictWithLocal,
    resolveConflictWithRemote,
    cancelConflictResolution,

    // Meter Types
    addMeterType,
    updateMeterType,
    deleteMeterType,

    // Meters
    addMeter,
    updateMeter,
    deleteMeter,
    getMeter,
    getMeterWithType,

    // Readings
    addReading,
    updateReading,
    deleteReading,
    getReadingsForMeter,
    getLatestReading,

    // Settings
    updateSettings,

    // Export/Import
    exportAsJSON,
    exportAsCSV,
    importFromJSON
  }
})