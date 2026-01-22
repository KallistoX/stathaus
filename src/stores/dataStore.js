import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { DataManager } from '@/storage/DataManager.js'
import { IndexedDBAdapter } from '@/storage/IndexedDBAdapter.js'
import { FileSystemAdapter } from '@/storage/FileSystemAdapter.js'
import { WebDAVAdapter } from '@/storage/WebDAVAdapter.js'

export const useDataStore = defineStore('data', () => {
  // State
  const dataManager = ref(null)
  const isInitialized = ref(false)
  const isLoading = ref(false)
  const error = ref(null)
  const data = ref(null)
  const theme = ref('light')
  const showFileRecoveryModal = ref(false)
  const missingFileName = ref(null)
  const fileRecoveryResolve = ref(null)

  // Permission state
  const permissionState = ref({
    read: 'unknown',
    write: 'unknown',
    fileName: null,
    needsPermission: false
  })
  const showPermissionModal = ref(false)
  const permissionModalResolve = ref(null)
  const showPermissionBanner = ref(false)
  const pendingFsAdapter = ref(null)

  // WebDAV sync state
  const syncStatus = ref('idle') // idle | syncing | synced | error | offline
  const syncError = ref(null)
  const lastSyncTime = ref(null)
  const webdavServerUrl = ref(null)
  const webdavUsername = ref(null)

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

  const filePermissionState = computed(() => permissionState.value)
  const needsPermissionGrant = computed(() =>
    permissionState.value.read === 'prompt' ||
    permissionState.value.write === 'prompt'
  )

  // Actions
  async function initialize() {
    if (isInitialized.value) return

    isLoading.value = true
    error.value = null

    try {
      // Try to restore FileSystem adapter first
      const fsAdapter = new FileSystemAdapter()
      const initResult = await fsAdapter.init()

      let adapter
      let loadFailed = false
      let fileName = null

      if (fsAdapter.hasFileHandle()) {
        fileName = fsAdapter.fileHandle.name
        const pState = initResult.permissionState

        // Update permission state
        permissionState.value = {
          read: pState.read,
          write: pState.write,
          fileName: pState.fileName,
          needsPermission: pState.read === 'prompt' || pState.write === 'prompt'
        }

        // If permission is 'prompt', we need user gesture to request permission
        if (permissionState.value.needsPermission) {
          // Initialize with IndexedDB temporarily while waiting for permission
          adapter = new IndexedDBAdapter()
          dataManager.value = new DataManager(adapter)
          await dataManager.value.init()
          data.value = dataManager.value.getAllData()

          // Listen to data changes
          dataManager.value.onChange((newData) => {
            data.value = newData
          })

          // Restore theme preference
          const savedTheme = data.value?.settings?.theme || 'light'
          setTheme(savedTheme)

          isInitialized.value = true
          isLoading.value = false

          // Store the adapter for later use when permission is granted
          pendingFsAdapter.value = fsAdapter

          // Show permission modal - user needs to grant access
          showPermissionModal.value = true
          return
        }

        // Permission is already granted - try to load
        try {
          adapter = fsAdapter
          const testManager = new DataManager(adapter)
          await testManager.init()

          // If we got here, file exists and is readable
          dataManager.value = testManager

          // Update permission state to confirmed granted
          permissionState.value.read = 'granted'
          permissionState.value.write = 'granted'
          permissionState.value.needsPermission = false
        } catch (err) {
          console.warn('Failed to load from saved file handle:', err)

          // Check if file was deleted
          if (err.message.includes('gelöscht') || err.message.includes('nicht mehr verfügbar') || err.name === 'NotFoundError') {
            await fsAdapter.closeFile()
            loadFailed = true
          } else {
            // Some other error - might be permission related
            throw err
          }
        }
      }

      if (loadFailed) {
        // Ask user what to do about the missing file
        // First, temporarily initialize with IndexedDB so the app can show UI
        adapter = new IndexedDBAdapter()
        dataManager.value = new DataManager(adapter)
        await dataManager.value.init()
        data.value = dataManager.value.getAllData()

        // Listen to data changes
        dataManager.value.onChange((newData) => {
          data.value = newData
        })

        // Restore theme preference
        const savedTheme = data.value?.settings?.theme || 'light'
        setTheme(savedTheme)

        isInitialized.value = true
        isLoading.value = false

        // Now prompt user for action
        await handleMissingFile(fileName)
        return
      }

      if (!adapter) {
        // Use IndexedDB as default
        adapter = new IndexedDBAdapter()
        dataManager.value = new DataManager(adapter)
        await dataManager.value.init()
      }

      data.value = dataManager.value.getAllData()

      // Listen to data changes
      dataManager.value.onChange((newData) => {
        data.value = newData
      })

      // Listen for permission errors during save operations
      dataManager.value.onPermissionError((err) => {
        console.warn('Permission error during save:', err)
        showPermissionBanner.value = true
        // Store the current adapter for retry
        if (dataManager.value.adapter.constructor.name === 'FileSystemAdapter') {
          pendingFsAdapter.value = dataManager.value.adapter
        }
      })

      // Restore theme preference
      const savedTheme = data.value?.settings?.theme || 'light'
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

  async function handleMissingFile(fileName) {
    // Show modal and wait for user decision
    missingFileName.value = fileName
    showFileRecoveryModal.value = true

    return new Promise((resolve) => {
      fileRecoveryResolve.value = resolve
    })
  }

  async function onFileRecoverySelectFile() {
    showFileRecoveryModal.value = false
    try {
      const success = await switchToFileSystem('open')
      if (fileRecoveryResolve.value) {
        fileRecoveryResolve.value()
        fileRecoveryResolve.value = null
      }
    } catch (err) {
      console.error('Error selecting file:', err)
      if (fileRecoveryResolve.value) {
        fileRecoveryResolve.value()
        fileRecoveryResolve.value = null
      }
    }
  }

  async function onFileRecoveryCreateNew() {
    showFileRecoveryModal.value = false
    try {
      const success = await switchToFileSystem('new')
      if (fileRecoveryResolve.value) {
        fileRecoveryResolve.value()
        fileRecoveryResolve.value = null
      }
    } catch (err) {
      console.error('Error creating new file:', err)
      if (fileRecoveryResolve.value) {
        fileRecoveryResolve.value()
        fileRecoveryResolve.value = null
      }
    }
  }

  function onFileRecoveryUseLocal() {
    showFileRecoveryModal.value = false
    // Already using IndexedDB, just close modal
    if (fileRecoveryResolve.value) {
      fileRecoveryResolve.value()
      fileRecoveryResolve.value = null
    }
  }

  // Permission modal handlers
  async function onPermissionGranted() {
    if (!pendingFsAdapter.value) {
      console.error('No pending file system adapter')
      showPermissionModal.value = false
      return
    }

    try {
      // Request permission - this MUST be called from user gesture (click handler)
      const result = await pendingFsAdapter.value.requestPermissionFromGesture('readwrite')

      if (result === 'granted') {
        // Permission granted - switch the current dataManager to use the file system adapter
        // and load data from the file (not migrate current data)
        // Skip init since the adapter already has the file handle and we just got permission
        await dataManager.value.switchAdapter(pendingFsAdapter.value, true, true)

        // Update our local data reference
        data.value = dataManager.value.getAllData()

        // Listen for permission errors during save operations
        dataManager.value.onPermissionError((err) => {
          console.warn('Permission error during save:', err)
          showPermissionBanner.value = true
          pendingFsAdapter.value = dataManager.value.adapter
        })

        // Update permission state
        permissionState.value.read = 'granted'
        permissionState.value.write = 'granted'
        permissionState.value.needsPermission = false

        showPermissionModal.value = false
        pendingFsAdapter.value = null
      } else {
        // Permission denied
        permissionState.value.read = 'denied'
        permissionState.value.write = 'denied'
        // Keep modal open so user can choose alternative
      }
    } catch (err) {
      console.error('Permission request failed:', err)
      error.value = err.message
    }
  }

  async function onPermissionSelectDifferent() {
    showPermissionModal.value = false
    pendingFsAdapter.value = null

    // Let user select a different file
    try {
      await switchToFileSystem('open')
    } catch (err) {
      console.error('Error selecting different file:', err)
    }
  }

  function onPermissionUseLocal() {
    showPermissionModal.value = false
    pendingFsAdapter.value = null

    // Clear the stored file handle since user chose local storage
    const fsAdapter = new FileSystemAdapter()
    fsAdapter.closeFile()

    // Reset permission state
    permissionState.value = {
      read: 'no-handle',
      write: 'no-handle',
      fileName: null,
      needsPermission: false
    }

    // Already using IndexedDB, just close modal
  }

  function dismissPermissionBanner() {
    showPermissionBanner.value = false
  }

  async function retryPermission() {
    if (!pendingFsAdapter.value) {
      return
    }

    try {
      const result = await pendingFsAdapter.value.requestPermissionFromGesture('readwrite')
      if (result === 'granted') {
        // Switch back to file system
        await dataManager.value.switchAdapter(pendingFsAdapter.value, false)
        showPermissionBanner.value = false
        pendingFsAdapter.value = null

        permissionState.value.read = 'granted'
        permissionState.value.write = 'granted'
        permissionState.value.needsPermission = false
      }
    } catch (err) {
      console.error('Retry permission failed:', err)
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

  async function switchToFileSystem(mode = 'new') {
    isLoading.value = true
    error.value = null

    try {
      const fsAdapter = new FileSystemAdapter()

      if (!await fsAdapter.canUse()) {
        throw new Error('Dein Browser unterstützt die Dateisystem-API nicht')
      }

      let success
      const isOpeningExisting = mode === 'open'

      if (mode === 'new') {
        success = await fsAdapter.createNewFile()
      } else {
        success = await fsAdapter.openExistingFile()
      }

      if (!success) {
        return false // User cancelled
      }

      // If opening existing file, load data from it; otherwise migrate from current adapter
      await dataManager.value.switchAdapter(fsAdapter, isOpeningExisting)
      return true
    } catch (err) {
      console.error('Error switching to file system:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function switchToIndexedDB() {
    isLoading.value = true
    error.value = null

    try {
      const idbAdapter = new IndexedDBAdapter()
      await dataManager.value.switchAdapter(idbAdapter)
    } catch (err) {
      console.error('Error switching to IndexedDB:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function switchToWebDAV(config) {
    isLoading.value = true
    error.value = null
    syncStatus.value = 'syncing'

    try {
      const webdavAdapter = new WebDAVAdapter()

      // Configure and test connection
      await webdavAdapter.configure(
        config.serverUrl,
        config.username,
        config.password,
        config.filePath
      )

      if (!await webdavAdapter.canUse()) {
        throw new Error('WebDAV-Adapter kann nicht initialisiert werden')
      }

      // Initialize and test connection
      await webdavAdapter.init()

      // Migrate data from current adapter
      await dataManager.value.switchAdapter(webdavAdapter, false)

      // Store server info
      webdavServerUrl.value = config.serverUrl
      webdavUsername.value = config.username

      // Update sync status
      syncStatus.value = 'synced'
      syncError.value = null
      lastSyncTime.value = new Date().toISOString()

      return true
    } catch (err) {
      console.error('Error switching to WebDAV:', err)
      error.value = err.message
      syncStatus.value = 'error'
      syncError.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Watch for data changes and update sync status
  watch(
    () => data.value,
    () => {
      if (storageMode.value === 'webdav' && syncStatus.value !== 'error') {
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
      if (storageMode.value === 'webdav' && syncStatus.value === 'offline') {
        syncStatus.value = 'idle'
      }
    })

    window.addEventListener('offline', () => {
      if (storageMode.value === 'webdav') {
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
    showFileRecoveryModal,
    missingFileName,

    // Permission State
    permissionState: filePermissionState,
    needsPermissionGrant,
    showPermissionModal,
    showPermissionBanner,

    // WebDAV Sync State
    syncStatus,
    syncError,
    lastSyncTime,
    webdavServerUrl,
    webdavUsername,

    // Actions
    initialize,
    switchToFileSystem,
    switchToIndexedDB,
    switchToWebDAV,

    // Theme
    setTheme,
    toggleTheme,

    // File Recovery
    onFileRecoverySelectFile,
    onFileRecoveryCreateNew,
    onFileRecoveryUseLocal,

    // Permission Handlers
    onPermissionGranted,
    onPermissionSelectDifferent,
    onPermissionUseLocal,
    dismissPermissionBanner,
    retryPermission,

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