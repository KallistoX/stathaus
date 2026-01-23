<template>
  <div v-if="shouldShow" class="relative">
    <!-- Status Button -->
    <button
      @click="toggleDetails"
      class="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
      :class="getStatusClasses()"
      :title="getTooltip()"
    >
      <!-- Icon -->
      <span class="text-lg" :class="{ 'animate-spin': syncStatus === 'syncing' }">
        {{ getStatusIcon() }}
      </span>

      <!-- Text (Hidden on mobile) -->
      <span class="hidden sm:inline text-sm font-medium">
        {{ getStatusText() }}
      </span>

      <!-- Last Sync Time (on hover, desktop only) -->
      <span v-if="lastSyncTime && syncStatus === 'synced'" class="hidden lg:inline text-xs opacity-75">
        {{ getRelativeTime() }}
      </span>
    </button>

    <!-- Details Popup -->
    <div
      v-if="showDetails"
      class="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
      @click.stop
    >
      <!-- Header -->
      <div class="p-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-gray-900">Sync-Status</h3>
          <button
            @click="showDetails = false"
            class="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-4 space-y-4">
        <!-- Current Status -->
        <div>
          <div class="flex items-center gap-3 mb-2">
            <span class="text-2xl" :class="{ 'animate-spin': syncStatus === 'syncing' }">
              {{ getStatusIcon() }}
            </span>
            <div class="flex-1">
              <p class="font-medium text-gray-900">{{ getStatusText() }}</p>
              <p v-if="lastSyncTime" class="text-xs text-gray-500">
                Zuletzt: {{ getFullTime() }}
              </p>
            </div>
          </div>

          <!-- Error Details -->
          <div v-if="syncError" class="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
            <p class="font-medium mb-1">Fehler:</p>
            <p>{{ syncError }}</p>
          </div>
        </div>

        <!-- Server Info -->
        <div v-if="serverInfo" class="pt-4 border-t border-gray-200">
          <p class="text-xs font-medium text-gray-700 mb-2">Server-Informationen:</p>
          <div class="space-y-1 text-xs text-gray-600">
            <div class="flex justify-between">
              <span>Server:</span>
              <span class="font-mono text-gray-900">{{ serverInfo.hostname }}</span>
            </div>
            <div v-if="serverInfo.username" class="flex justify-between">
              <span>Benutzer:</span>
              <span class="font-medium text-gray-900">{{ serverInfo.username }}</span>
            </div>
          </div>
        </div>

        <!-- Network Status -->
        <div class="pt-4 border-t border-gray-200">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600">Netzwerk:</span>
            <span :class="isOnline ? 'text-green-600' : 'text-red-600'" class="font-medium">
              {{ isOnline ? '✓ Online' : '✗ Offline' }}
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="pt-4 border-t border-gray-200 space-y-2">
          <button
            v-if="syncStatus === 'error'"
            @click="retrySync"
            class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
          >
            Erneut versuchen
          </button>

          <button
            @click="goToSettings"
            class="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm"
          >
            Einstellungen öffnen
          </button>
        </div>
      </div>
    </div>

    <!-- Click Outside to Close -->
    <div
      v-if="showDetails"
      @click="showDetails = false"
      class="fixed inset-0 z-40"
    ></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  syncStatus: {
    type: String,
    default: 'idle',
    validator: (value) => ['idle', 'syncing', 'synced', 'error', 'offline'].includes(value)
  },
  syncError: {
    type: String,
    default: null
  },
  lastSyncTime: {
    type: [String, Date],
    default: null
  },
  serverUrl: {
    type: String,
    default: null
  },
  username: {
    type: String,
    default: null
  },
  storageMode: {
    type: String,
    default: 'indexeddb'
  }
})

const emit = defineEmits(['retry'])

const router = useRouter()
const showDetails = ref(false)
const isOnline = ref(navigator.onLine)

// Should show indicator (only for Cloud mode)
const shouldShow = computed(() => {
  return props.storageMode === 'cloud'
})

// Server info
const serverInfo = computed(() => {
  if (!props.serverUrl) return null

  try {
    const url = new URL(props.serverUrl)
    return {
      hostname: url.hostname,
      username: props.username
    }
  } catch {
    return null
  }
})

// Get status icon
function getStatusIcon() {
  switch (props.syncStatus) {
    case 'syncing':
      return '↻'
    case 'synced':
      return '✓'
    case 'error':
      return '✗'
    case 'offline':
      return '⊘'
    default:
      return '○'
  }
}

// Get status text
function getStatusText() {
  switch (props.syncStatus) {
    case 'syncing':
      return 'Synchronisiere...'
    case 'synced':
      return 'Synchronisiert'
    case 'error':
      return 'Sync-Fehler'
    case 'offline':
      return 'Offline'
    default:
      return 'Bereit'
  }
}

// Get status classes for button
function getStatusClasses() {
  switch (props.syncStatus) {
    case 'syncing':
      return 'bg-blue-100 text-blue-700 hover:bg-blue-200'
    case 'synced':
      return 'bg-green-100 text-green-700 hover:bg-green-200'
    case 'error':
      return 'bg-red-100 text-red-700 hover:bg-red-200'
    case 'offline':
      return 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    default:
      return 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  }
}

// Get tooltip
function getTooltip() {
  let tooltip = getStatusText()

  if (props.lastSyncTime) {
    tooltip += ` - ${getRelativeTime()}`
  }

  if (props.syncError) {
    tooltip += ` - ${props.syncError}`
  }

  return tooltip
}

// Get relative time
function getRelativeTime() {
  if (!props.lastSyncTime) return ''

  const date = new Date(props.lastSyncTime)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'gerade eben'
  if (diffMins < 60) return `vor ${diffMins} Min`
  if (diffHours < 24) return `vor ${diffHours} Std`
  if (diffDays < 7) return `vor ${diffDays} Tagen`

  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Get full time
function getFullTime() {
  if (!props.lastSyncTime) return 'Nie'

  const date = new Date(props.lastSyncTime)
  return date.toLocaleString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Toggle details popup
function toggleDetails() {
  showDetails.value = !showDetails.value
}

// Retry sync
function retrySync() {
  showDetails.value = false
  emit('retry')
}

// Go to settings
function goToSettings() {
  showDetails.value = false
  router.push('/settings')
}

// Online/offline listeners
function handleOnline() {
  isOnline.value = true
}

function handleOffline() {
  isOnline.value = false
}

onMounted(() => {
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})
</script>

<style scoped>
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
