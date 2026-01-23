<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <router-link to="/" class="flex items-center">
            <img
              src="/logo_with_text_blue.png"
              alt="StatHaus"
              class="h-8 dark:hidden"
            />
            <img
              src="/logo_with_text_white.png"
              alt="StatHaus"
              class="h-8 hidden dark:block"
            />
          </router-link>

          <!-- Center: Storage Info & Sync Status (Desktop) -->
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

          <!-- Right side: Navigation + User Profile -->
          <div class="flex items-center space-x-4">
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

            <!-- User Profile / Login Area -->
            <div class="flex items-center">
              <!-- When logged in: User avatar + logout -->
              <div v-if="isLoggedIn" class="flex items-center space-x-2">
                <div class="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <div class="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium">
                    {{ userInitial }}
                  </div>
                  <span class="hidden lg:block text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
                    {{ userDisplayName }}
                  </span>
                </div>
                <button
                  @click="handleLogout"
                  class="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Abmelden"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>

              <!-- When logged out: Login button -->
              <button
                v-else
                @click="handleLogin"
                :disabled="authLoading"
                class="flex items-center space-x-2 px-4 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors disabled:opacity-50"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span class="hidden sm:inline">{{ authLoading ? 'Lädt...' : 'Anmelden' }}</span>
              </button>
            </div>
          </div>
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

    <!-- Conflict Resolution Modal -->
    <ConflictResolutionModal
      v-if="showConflictModal"
      :local-data="conflictLocalData"
      :remote-data="conflictRemoteData"
      @resolve-local="dataStore.resolveConflictWithLocal"
      @resolve-remote="dataStore.resolveConflictWithRemote"
      @cancel="dataStore.cancelConflictResolution"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useDataStore } from '@/stores/dataStore'
import SyncStatusIndicator from '@/components/SyncStatusIndicator.vue'
import ConflictResolutionModal from '@/components/ConflictResolutionModal.vue'
import CloudStorageAdapter from '@/adapters/CloudStorageAdapter.js'

const dataStore = useDataStore()
const route = useRoute()
const cloudAdapter = new CloudStorageAdapter()

const navItems = [
  { path: '/', icon: '📊', label: 'Dashboard' },
  { path: '/meters', icon: '⚡', label: 'Zähler' },
  { path: '/reports', icon: '📄', label: 'Berichte' },
  { path: '/settings', icon: '⚙️', label: 'Einstellungen' }
]

// Auth state
const isLoggedIn = ref(false)
const userInfo = ref(null)
const authLoading = ref(false)

const userInitial = computed(() => {
  const name = userInfo.value?.name || userInfo.value?.email || 'U'
  return name.charAt(0).toUpperCase()
})

const userDisplayName = computed(() => {
  return userInfo.value?.name || userInfo.value?.email || 'User'
})

// Store state
const isLoading = computed(() => dataStore.isLoading)
const error = computed(() => dataStore.error)
const storageName = computed(() => dataStore.storageName)
const storageMode = computed(() => dataStore.storageMode)

// Sync state
const syncStatus = computed(() => dataStore.syncStatus)
const syncError = computed(() => dataStore.syncError)
const lastSyncTime = computed(() => dataStore.lastSyncTime)

// Conflict resolution state
const showConflictModal = computed(() => dataStore.showConflictModal)
const conflictLocalData = computed(() => dataStore.conflictLocalData)
const conflictRemoteData = computed(() => dataStore.conflictRemoteData)

async function handleLogin() {
  authLoading.value = true
  try {
    await cloudAdapter.login()
    // OAuth will redirect, so we won't reach here immediately
  } catch (err) {
    console.error('Login failed:', err)
    authLoading.value = false
  }
}

async function handleLogout() {
  try {
    await cloudAdapter.logout()
    isLoggedIn.value = false
    userInfo.value = null
    // Switch back to IndexedDB and clear data
    await dataStore.switchToIndexedDB(true)
  } catch (err) {
    console.error('Logout failed:', err)
  }
}

async function retryInit() {
  await dataStore.initialize()
}

async function checkAuthState() {
  const wasAuthenticated = cloudAdapter.isAuthenticated()

  // First check if already authenticated
  if (wasAuthenticated) {
    isLoggedIn.value = true
  } else {
    // Try to restore session using refresh token
    const restored = await cloudAdapter.tryRestoreSession()
    isLoggedIn.value = restored

    // If session was restored and we're not already on cloud storage, switch to cloud
    if (restored && dataStore.storageMode !== 'cloud') {
      try {
        await dataStore.switchToCloud()
      } catch (err) {
        console.error('Failed to switch to cloud storage:', err)
      }
    }
  }

  if (isLoggedIn.value) {
    try {
      userInfo.value = await cloudAdapter.getUserInfo()
    } catch (err) {
      console.error('Failed to load user info:', err)
      isLoggedIn.value = false
    }
  }
}

// Watch for route changes - re-check auth when returning from OAuth callback
watch(
  () => route.path,
  async (newPath, oldPath) => {
    // When navigating away from OAuth callback, re-check auth state
    if (oldPath === '/auth/callback' && newPath !== '/auth/callback') {
      await checkAuthState()
    }
  }
)

onMounted(async () => {
  await dataStore.initialize()
  // Only check auth state if not on OAuth callback page
  // (OAuth callback will handle auth and trigger route change, which we watch for)
  if (route.path !== '/auth/callback') {
    await checkAuthState()
  }
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