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

        <!-- File System -->
        <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900 dark:text-white">Dateisystem</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Speichere Daten in einer Datei (z.B. in Nextcloud, iCloud, etc.)
              </p>
              <ul class="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>✓ Geräteübergreifende Synchronisation</li>
                <li>✓ Manuelle Backup-Kontrolle</li>
                <li>✓ Cloud-Sync möglich (Nextcloud, etc.)</li>
                <li v-if="!fileSystemSupported" class="text-red-600 dark:text-red-400">✗ Nicht von diesem Browser unterstützt</li>
              </ul>
            </div>
            <div v-if="storageMode !== 'filesystem'" class="ml-4 space-y-2">
              <button
                @click="switchToFileSystem('new')"
                :disabled="isLoading || !fileSystemSupported"
                class="w-full px-4 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Neue Datei
              </button>
              <button
                @click="switchToFileSystem('existing')"
                :disabled="isLoading || !fileSystemSupported"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Datei öffnen
              </button>
            </div>
            <span v-else class="ml-4 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium">
              Aktiv
            </span>
          </div>
        </div>

        <!-- WebDAV Cloud Sync -->
        <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg" :class="{ 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700': storageMode === 'webdav' }">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900 dark:text-white">☁️ Cloud-Sync (WebDAV)</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Automatische Synchronisation mit Nextcloud, ownCloud oder anderen WebDAV-Diensten
              </p>
              <ul class="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>✓ iOS und Desktop kompatibel</li>
                <li>✓ Automatische Hintergrund-Synchronisation</li>
                <li>✓ Selbst gehostet oder Cloud-Anbieter</li>
                <li>✓ Konflikt-Erkennung bei mehreren Geräten</li>
              </ul>
            </div>
            <div class="ml-4">
              <button
                v-if="storageMode !== 'webdav'"
                @click="showWebDAVSetup = true"
                :disabled="isLoading"
                class="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Aktivieren
              </button>
              <button
                v-else
                @click="showWebDAVSetup = true"
                class="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-gray-900 dark:text-white"
              >
                Einstellungen
              </button>
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
    <div class="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-6">
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

    <!-- Add Meter Type Modal -->
    <AddMeterTypeModal
      v-if="showAddType"
      @close="showAddType = false"
      @added="handleTypeAdded"
    />

    <!-- WebDAV Setup Modal -->
    <WebDAVSetupModal
      v-if="showWebDAVSetup"
      :show="showWebDAVSetup"
      @complete="handleWebDAVComplete"
      @cancel="showWebDAVSetup = false"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import AddMeterTypeModal from '@/components/AddMeterTypeModal.vue'
import WebDAVSetupModal from '@/components/WebDAVSetupModal.vue'

const dataStore = useDataStore()

const showAddType = ref(false)
const showWebDAVSetup = ref(false)
const fileInput = ref(null)

const storageMode = computed(() => dataStore.storageMode)
const storageName = computed(() => dataStore.storageName)
const meterTypes = computed(() => dataStore.meterTypes)
const isLoading = computed(() => dataStore.isLoading)
const theme = computed(() => dataStore.theme)

const fileSystemSupported = ref('showOpenFilePicker' in window)

function toggleTheme() {
  dataStore.toggleTheme()
}

async function switchToIndexedDB() {
  if (confirm('Zu Browser-Speicher wechseln? Aktuelle Daten werden übernommen.')) {
    try {
      await dataStore.switchToIndexedDB()
    } catch (error) {
      alert('Fehler beim Wechseln: ' + error.message)
    }
  }
}

async function switchToFileSystem(mode) {
  try {
    const success = await dataStore.switchToFileSystem(mode)
    if (!success) {
      // User cancelled
      return
    }
  } catch (error) {
    alert('Fehler beim Wechseln: ' + error.message)
  }
}

async function handleWebDAVComplete(config) {
  try {
    await dataStore.switchToWebDAV(config)
    showWebDAVSetup.value = false
    alert('WebDAV-Synchronisation erfolgreich eingerichtet!')
  } catch (error) {
    alert('Fehler beim Einrichten: ' + error.message)
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
</script>