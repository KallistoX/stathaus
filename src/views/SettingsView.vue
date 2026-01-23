<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Einstellungen</h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        Verwalte Speicherort, Zählertypen und Daten
      </p>
    </div>

    <!-- Theme Settings -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">🎨 Darstellung</h2>

      <div class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div>
          <h3 class="font-medium text-gray-900 dark:text-white">Dark Mode</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Wechsle zwischen hellem und dunklem Design
          </p>
        </div>
        <button
          @click="toggleTheme"
          class="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          {{ theme === 'dark' ? '🌙 Dunkel' : '☀️ Hell' }}
        </button>
      </div>
    </div>

    <!-- Storage Settings -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">💾 Datenspeicherung</h2>

      <div class="space-y-4">
        <!-- Current Storage -->
        <div class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div class="flex items-start space-x-3">
            <span class="text-2xl">ℹ️</span>
            <div class="flex-1">
              <h3 class="font-medium text-blue-900 dark:text-blue-300">Aktueller Speicher</h3>
              <p class="text-sm text-blue-700 dark:text-blue-400 mt-1">{{ storageName }}</p>
            </div>
          </div>
        </div>

        <!-- IndexedDB -->
        <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900 dark:text-white">Browser-Speicher (IndexedDB)</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Daten werden im Browser gespeichert. Gut für ein einzelnes Gerät.
              </p>
              <ul class="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>✓ Einfach und schnell</li>
                <li>✓ Keine Dateiverwaltung nötig</li>
                <li>⚠️ Nur auf diesem Gerät verfügbar</li>
              </ul>
            </div>
            <button
              v-if="storageMode !== 'indexeddb'"
              @click="switchToIndexedDB"
              :disabled="isLoading"
              class="ml-4 px-4 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              Wechseln
            </button>
            <span v-else class="ml-4 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium">
              Aktiv
            </span>
          </div>
        </div>

        <!-- Cloud Sync via OAuth -->
        <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg" :class="{ 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700': isLoggedIn }">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900 dark:text-white">☁️ Cloud-Sync</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Sichere Synchronisation deiner Daten über mehrere Geräte hinweg
              </p>

              <!-- Logged in state -->
              <div v-if="isLoggedIn" class="mt-4 space-y-3">
                <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <div class="flex items-center gap-2 text-green-700 dark:text-green-400 mb-1">
                    <span class="text-lg">✓</span>
                    <span class="font-medium text-sm">Cloud-Sync aktiv</span>
                  </div>
                  <p class="text-xs text-gray-600 dark:text-gray-400">
                    Angemeldet als {{ userInfo?.email || userInfo?.name || 'User' }}
                  </p>
                  <p v-if="syncMetadata?.lastUpdated" class="text-xs text-gray-600 dark:text-gray-400">
                    Letzte Sync: {{ formatLastSync(syncMetadata.lastUpdated) }}
                  </p>
                  <p v-if="syncMetadata" class="text-xs text-gray-600 dark:text-gray-400">
                    {{ syncMetadata.metersCount || 0 }} Zähler, {{ syncMetadata.readingsCount || 0 }} Ablesungen
                  </p>
                </div>

                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Daten werden automatisch mit der Cloud synchronisiert. Die Anmeldung kannst du über das Benutzer-Menü in der Kopfzeile verwalten.
                </p>

                <p v-if="syncError" class="text-xs text-red-600 dark:text-red-400">{{ syncError }}</p>
                <p v-if="syncSuccess" class="text-xs text-green-600 dark:text-green-400">{{ syncSuccess }}</p>
              </div>

              <!-- Not logged in state -->
              <div v-else class="mt-4">
                <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>✓ Automatische Synchronisation</li>
                  <li>✓ Sichere Authentifizierung</li>
                  <li>✓ Geräteübergreifend verfügbar</li>
                  <li>✓ Verschlüsselte Datenübertragung</li>
                </ul>
                <p class="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  Melde dich über den Button in der Kopfzeile an, um Cloud-Sync zu aktivieren.
                </p>
              </div>
            </div>

            <!-- Status badge (right side) -->
            <div class="ml-4">
              <span
                v-if="isLoggedIn"
                class="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium inline-block"
              >
                Aktiv
              </span>
              <span
                v-else
                class="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-sm font-medium inline-block"
              >
                Inaktiv
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Meter Types -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">⚡ Zählertypen</h2>
        <button
          @click="showAddType = true"
          class="px-4 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors text-sm"
        >
          + Typ hinzufügen
        </button>
      </div>

      <div v-if="meterTypes.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
        Noch keine Zählertypen definiert
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="type in meterTypes"
          :key="type.id"
          class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
        >
          <div class="flex items-center space-x-3">
            <span class="text-2xl">{{ type.icon }}</span>
            <div>
              <h3 class="font-medium text-gray-900 dark:text-white">{{ type.name }}</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">Einheit: {{ type.unit }}</p>
            </div>
          </div>
          <button
            @click="confirmDeleteType(type)"
            class="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Löschen"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>

    <!-- Export / Import -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">📦 Export & Import</h2>

      <div class="space-y-3">
        <button
          @click="exportJSON"
          class="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div class="flex items-center space-x-3">
            <span class="text-xl">📄</span>
            <div class="text-left">
              <h3 class="font-medium text-gray-900 dark:text-white">Als JSON exportieren</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">Backup aller Daten erstellen</p>
            </div>
          </div>
          <span class="text-gray-400 dark:text-gray-500">→</span>
        </button>

        <button
          @click="exportCSV"
          class="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div class="flex items-center space-x-3">
            <span class="text-xl">📊</span>
            <div class="text-left">
              <h3 class="font-medium text-gray-900 dark:text-white">Als CSV exportieren</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">Für Excel, LibreOffice, etc.</p>
            </div>
          </div>
          <span class="text-gray-400 dark:text-gray-500">→</span>
        </button>

        <div class="relative">
          <input
            ref="fileInput"
            type="file"
            accept=".json"
            @change="handleImport"
            class="hidden"
          >
          <button
            @click="$refs.fileInput.click()"
            class="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div class="flex items-center space-x-3">
              <span class="text-xl">📥</span>
              <div class="text-left">
                <h3 class="font-medium text-gray-900 dark:text-white">JSON importieren</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">Backup wiederherstellen</p>
              </div>
            </div>
            <span class="text-gray-400 dark:text-gray-500">→</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Danger Zone -->
    <div class="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-6 mb-6">
      <h2 class="text-lg font-semibold text-red-900 dark:text-red-300 mb-4">⚠️ Gefahrenzone</h2>
      <p class="text-sm text-red-700 dark:text-red-400 mb-4">
        Diese Aktionen können nicht rückgängig gemacht werden!
      </p>
      <button
        @click="confirmReset"
        class="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
      >
        Alle Daten löschen
      </button>
    </div>

    <!-- App Info -->
    <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">ℹ️ App-Info</h2>
      <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
        <div class="flex justify-between">
          <span>Version:</span>
          <span class="font-mono text-gray-900 dark:text-white">v{{ appVersion }}</span>
        </div>
        <div class="flex justify-between">
          <span>Build:</span>
          <span class="font-mono text-gray-900 dark:text-white">{{ buildTime }}</span>
        </div>
      </div>
    </div>

    <!-- Add Meter Type Modal -->
    <AddMeterTypeModal
      v-if="showAddType"
      @close="showAddType = false"
      @added="handleTypeAdded"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import AddMeterTypeModal from '@/components/AddMeterTypeModal.vue'
import CloudStorageAdapter from '@/adapters/CloudStorageAdapter.js'

const dataStore = useDataStore()
const cloudAdapter = new CloudStorageAdapter()

const showAddType = ref(false)
const fileInput = ref(null)

// Cloud sync state
const isLoggedIn = ref(false)
const userInfo = ref(null)
const syncMetadata = ref(null)
const syncError = ref(null)
const syncSuccess = ref(null)

const storageMode = computed(() => dataStore.storageMode)
const storageName = computed(() => dataStore.storageName)
const meterTypes = computed(() => dataStore.meterTypes)
const isLoading = computed(() => dataStore.isLoading)
const theme = computed(() => dataStore.theme)

// App version info (injected at build time)
const appVersion = __APP_VERSION__
const buildTime = computed(() => {
  const date = new Date(__BUILD_TIME__)
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

function toggleTheme() {
  dataStore.toggleTheme()
}

async function switchToIndexedDB() {
  if (!isLoggedIn.value) {
    // Already on IndexedDB, nothing to do
    return
  }
  if (confirm('Zu Browser-Speicher wechseln? Du wirst abgemeldet und lokale Daten werden neu erstellt.')) {
    try {
      await cloudAdapter.logout()
      await dataStore.switchToIndexedDB(true)
      isLoggedIn.value = false
      userInfo.value = null
      syncMetadata.value = null
    } catch (error) {
      alert('Fehler beim Wechseln: ' + error.message)
    }
  }
}

function exportJSON() {
  dataStore.exportAsJSON()
}

function exportCSV() {
  dataStore.exportAsCSV()
}

async function handleImport(event) {
  const file = event.target.files[0]
  if (!file) return

  if (confirm('Daten importieren? Aktuelle Daten werden überschrieben!')) {
    try {
      await dataStore.importFromJSON(file)
      alert('Daten erfolgreich importiert!')
    } catch (error) {
      alert('Fehler beim Importieren: ' + error.message)
    }
  }

  // Reset file input
  event.target.value = ''
}

function confirmDeleteType(type) {
  try {
    if (confirm(`Zählertyp "${type.name}" löschen?`)) {
      dataStore.deleteMeterType(type.id)
    }
  } catch (error) {
    alert('Fehler: ' + error.message)
  }
}

function confirmReset() {
  if (confirm('WIRKLICH ALLE Daten löschen? Dies kann nicht rückgängig gemacht werden!')) {
    if (confirm('Letzte Bestätigung: Alle Zähler und Ablesungen werden unwiderruflich gelöscht!')) {
      // Reset data to empty
      dataStore.data.meterTypes = []
      dataStore.data.meters = []
      dataStore.data.readings = []
      dataStore.updateSettings({})
      alert('Alle Daten wurden gelöscht.')
    }
  }
}

function handleTypeAdded() {
  showAddType.value = false
}

// Check auth state on mount
onMounted(async () => {
  isLoggedIn.value = cloudAdapter.isAuthenticated()

  if (isLoggedIn.value) {
    try {
      userInfo.value = await cloudAdapter.getUserInfo()
      syncMetadata.value = await cloudAdapter.getMetadata()
    } catch (error) {
      console.error('Failed to load user info:', error)
      isLoggedIn.value = false
    }
  }
})

function formatLastSync(timestamp) {
  if (!timestamp) return 'Nie'

  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Gerade eben'
  if (diffMins < 60) return `vor ${diffMins} Min`
  if (diffHours < 24) return `vor ${diffHours} Std`
  if (diffDays < 7) return `vor ${diffDays} Tagen`

  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>