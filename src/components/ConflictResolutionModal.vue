<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="bg-yellow-50 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-800 p-4">
        <div class="flex items-center gap-3">
          <div class="text-yellow-600 dark:text-yellow-400 text-3xl">⚠️</div>
          <div>
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">Synchronisationskonflikt erkannt</h2>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Die Daten wurden auf einem anderen Gerät geändert
            </p>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6">
        <div class="mb-6">
          <p class="text-gray-700 dark:text-gray-300 mb-4">
            Deine lokalen Änderungen sind neuer als die Version auf dem Server oder umgekehrt.
            Bitte wähle, welche Version behalten werden soll:
          </p>

          <!-- Conflict Info -->
          <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-sm space-y-2">
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Lokale Version:</span>
              <span class="font-medium dark:text-white">{{ formatDate(localLastModified) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Server-Version:</span>
              <span class="font-medium dark:text-white">{{ formatDate(remoteLastModified) }}</span>
            </div>
            <div v-if="localData && remoteData" class="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
              <span class="text-gray-600 dark:text-gray-400">Unterschiede:</span>
              <span class="font-medium dark:text-white">
                {{ getDifferenceSummary() }}
              </span>
            </div>
          </div>
        </div>

        <!-- Options -->
        <div class="space-y-3">
          <!-- Use Local Version -->
          <button
            @click="resolveWithLocal"
            :disabled="resolving"
            class="w-full text-left p-4 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
            :class="{ 'opacity-50 cursor-not-allowed': resolving }"
          >
            <div class="flex items-start gap-3">
              <div class="text-2xl">💻</div>
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900 dark:text-white">Lokale Version verwenden</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Deine lokalen Änderungen werden auf den Server hochgeladen und überschreiben die Server-Version.
                </p>
                <div v-if="localData" class="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {{ localData.meters?.length || 0 }} Zähler,
                  {{ localData.readings?.length || 0 }} Zählerstände
                </div>
              </div>
            </div>
          </button>

          <!-- Use Remote Version -->
          <button
            @click="resolveWithRemote"
            :disabled="resolving"
            class="w-full text-left p-4 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
            :class="{ 'opacity-50 cursor-not-allowed': resolving }"
          >
            <div class="flex items-start gap-3">
              <div class="text-2xl">☁️</div>
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900 dark:text-white">Server-Version verwenden</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Die Version vom Server wird heruntergeladen und überschreibt deine lokalen Änderungen.
                </p>
                <div v-if="remoteData" class="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {{ remoteData.meters?.length || 0 }} Zähler,
                  {{ remoteData.readings?.length || 0 }} Zählerstände
                </div>
              </div>
            </div>
          </button>

          <!-- View Differences (Future Enhancement) -->
          <div v-if="showViewDifferences" class="pt-2">
            <button
              @click="viewDifferences"
              class="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-2"
            >
              <span>📋</span>
              <span>Unterschiede im Detail anzeigen</span>
            </button>
          </div>
        </div>

        <!-- Warning -->
        <div class="mt-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p class="text-sm text-red-800 dark:text-red-300">
            <strong>Wichtig:</strong> Die nicht gewählte Version geht verloren.
            Stelle sicher, dass du die richtige Version auswählst.
          </p>
        </div>

        <!-- Error Display -->
        <div v-if="error" class="mt-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p class="text-sm text-red-800 dark:text-red-300">
            <strong>Fehler:</strong> {{ error }}
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-700 flex justify-end gap-3">
        <button
          @click="cancel"
          :disabled="resolving"
          class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
          :class="{ 'opacity-50 cursor-not-allowed': resolving }"
        >
          Abbrechen
        </button>
      </div>

      <!-- Loading Overlay -->
      <div v-if="resolving" class="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 flex items-center justify-center">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p class="text-gray-600 dark:text-gray-400">Konflikt wird aufgelöst...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  localData: {
    type: Object,
    default: null
  },
  remoteData: {
    type: Object,
    default: null
  }
})

// Computed timestamps from data
const localLastModified = computed(() => props.localData?.lastModified)
const remoteLastModified = computed(() => props.remoteData?.lastModified)

const emit = defineEmits(['resolve-local', 'resolve-remote', 'cancel'])

const resolving = ref(false)
const error = ref(null)
const showViewDifferences = ref(false) // Future enhancement

function formatDate(dateString) {
  if (!dateString) return 'Unbekannt'

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 1000 / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffMin < 1) {
    return 'Gerade eben'
  } else if (diffMin < 60) {
    return `Vor ${diffMin} Minute${diffMin === 1 ? '' : 'n'}`
  } else if (diffHour < 24) {
    return `Vor ${diffHour} Stunde${diffHour === 1 ? '' : 'n'}`
  } else if (diffDay < 7) {
    return `Vor ${diffDay} Tag${diffDay === 1 ? '' : 'en'}`
  } else {
    return date.toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

function getDifferenceSummary() {
  if (!props.localData || !props.remoteData) {
    return 'Kann nicht berechnet werden'
  }

  const meterDiff = Math.abs((props.localData.meters?.length || 0) - (props.remoteData.meters?.length || 0))
  const readingDiff = Math.abs((props.localData.readings?.length || 0) - (props.remoteData.readings?.length || 0))

  const parts = []
  if (meterDiff > 0) {
    parts.push(`${meterDiff} Zähler`)
  }
  if (readingDiff > 0) {
    parts.push(`${readingDiff} Zählerstände`)
  }

  return parts.length > 0 ? parts.join(', ') : 'Keine wesentlichen Unterschiede'
}

async function resolveWithLocal() {
  resolving.value = true
  error.value = null

  try {
    emit('resolve-local')
  } catch (err) {
    error.value = err.message
    resolving.value = false
  }
}

async function resolveWithRemote() {
  resolving.value = true
  error.value = null

  try {
    emit('resolve-remote')
  } catch (err) {
    error.value = err.message
    resolving.value = false
  }
}

function cancel() {
  if (!resolving.value) {
    emit('cancel')
  }
}

function viewDifferences() {
  // Future enhancement: Show detailed diff view
  console.log('View differences - to be implemented')
}
</script>

<style scoped>
/* Additional styles if needed */
</style>
