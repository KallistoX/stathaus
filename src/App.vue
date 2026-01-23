<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <router-link to="/" class="flex items-center space-x-2">
            <span class="text-2xl">🏠</span>
            <span class="text-xl font-bold text-gray-900 dark:text-white">StatHaus</span>
          </router-link>

          <!-- Storage Info (Desktop) -->
          <div class="hidden md:flex items-center space-x-4">
            <div class="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <span>💾</span>
              <span>{{ storageName }}</span>
            </div>

            <!-- Sync Status Indicator -->
            <SyncStatusIndicator
              :sync-status="syncStatus"
              :sync-error="syncError"
              :last-sync-time="lastSyncTime"
              :storage-mode="storageMode"
            />
          </div>

          <!-- Navigation -->
          <nav class="flex items-center space-x-1">
            <router-link
              v-for="item in navItems"
              :key="item.path"
              :to="item.path"
              class="nav-item"
              :class="{ 'nav-item-active': $route.path === item.path }"
            >
              <span class="text-lg">{{ item.icon }}</span>
              <span class="hidden sm:inline">{{ item.label }}</span>
            </router-link>
          </nav>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 bg-gray-50 dark:bg-gray-900">
      <div v-if="isLoading" class="flex items-center justify-center h-64">
        <div class="text-center">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p class="mt-4 text-gray-600 dark:text-gray-400">Lade Daten...</p>
        </div>
      </div>

      <div v-else-if="error" class="max-w-2xl mx-auto mt-8 px-4">
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 class="text-red-800 dark:text-red-300 font-semibold mb-2">Fehler beim Laden</h3>
          <p class="text-red-600 dark:text-red-400">{{ error }}</p>
          <button
            @click="retryInit"
            class="mt-4 px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600"
          >
            Erneut versuchen
          </button>
        </div>
      </div>

      <router-view v-else />
    </main>

    <!-- Footer (Mobile Storage Info) -->
    <footer class="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2">
      <div class="text-xs text-gray-500 dark:text-gray-400 text-center">
        💾 {{ storageName }}
      </div>
    </footer>

    <!-- File Recovery Modal -->
    <FileRecoveryModal
      v-if="showFileRecoveryModal"
      :file-name="missingFileName"
      @select-file="dataStore.onFileRecoverySelectFile"
      @create-new="dataStore.onFileRecoveryCreateNew"
      @use-local="dataStore.onFileRecoveryUseLocal"
    />

    <!-- Permission Request Modal -->
    <PermissionRequestModal
      v-if="showPermissionModal"
      :file-name="permissionState?.fileName"
      @granted="dataStore.onPermissionGranted"
      @select-different="dataStore.onPermissionSelectDifferent"
      @use-local="dataStore.onPermissionUseLocal"
    />

    <!-- Permission Denied Banner -->
    <PermissionDeniedBanner
      v-if="showPermissionBanner"
      @retry="dataStore.retryPermission"
      @dismiss="dataStore.dismissPermissionBanner"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import FileRecoveryModal from '@/components/FileRecoveryModal.vue'
import PermissionRequestModal from '@/components/PermissionRequestModal.vue'
import PermissionDeniedBanner from '@/components/PermissionDeniedBanner.vue'
import SyncStatusIndicator from '@/components/SyncStatusIndicator.vue'

const dataStore = useDataStore()

const navItems = [
  { path: '/', icon: '📊', label: 'Dashboard' },
  { path: '/meters', icon: '⚡', label: 'Zähler' },
  { path: '/settings', icon: '⚙️', label: 'Einstellungen' }
]

const isLoading = computed(() => dataStore.isLoading)
const error = computed(() => dataStore.error)
const storageName = computed(() => dataStore.storageName)
const storageMode = computed(() => dataStore.storageMode)
const showFileRecoveryModal = computed(() => dataStore.showFileRecoveryModal)
const missingFileName = computed(() => dataStore.missingFileName)
const showPermissionModal = computed(() => dataStore.showPermissionModal)
const showPermissionBanner = computed(() => dataStore.showPermissionBanner)
const permissionState = computed(() => dataStore.permissionState)

// Sync state
const syncStatus = computed(() => dataStore.syncStatus)
const syncError = computed(() => dataStore.syncError)
const lastSyncTime = computed(() => dataStore.lastSyncTime)

async function retryInit() {
  await dataStore.initialize()
}

onMounted(async () => {
  await dataStore.initialize()
})
</script>

<style scoped>
.nav-item {
  @apply flex items-center space-x-1 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors;
}

.nav-item-active {
  @apply bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium;
}
</style>