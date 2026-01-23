<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div class="max-w-md w-full p-8 text-center">
      <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {{ statusMessage }}
      </h2>
      <p v-if="errorMessage" class="text-red-600 dark:text-red-400 mt-4">
        {{ errorMessage }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import CloudStorageAdapter from '@/adapters/CloudStorageAdapter.js'

const router = useRouter()
const cloudAdapter = new CloudStorageAdapter()
const statusMessage = ref('Wird geladen...')
const errorMessage = ref('')

onMounted(async () => {
  // Check if already authenticated
  if (cloudAdapter.isAuthenticated()) {
    statusMessage.value = 'Bereits angemeldet, Weiterleitung...'
    router.push('/')
    return
  }

  // Try to restore session with refresh token
  try {
    statusMessage.value = 'Session wird wiederhergestellt...'
    const restored = await cloudAdapter.tryRestoreSession()
    if (restored) {
      statusMessage.value = 'Session wiederhergestellt, Weiterleitung...'
      router.push('/')
      return
    }
  } catch {
    // Session restore failed, will initiate login
  }

  // Not authenticated, initiate login flow
  statusMessage.value = 'Anmeldung wird gestartet...'
  try {
    await cloudAdapter.login()
    // OAuth will redirect, so we won't reach here
  } catch (err) {
    statusMessage.value = 'Anmeldung fehlgeschlagen'
    errorMessage.value = err.message || 'Bitte versuchen Sie es erneut.'
  }
})
</script>
