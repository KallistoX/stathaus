<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div class="max-w-md w-full p-8">
      <div v-if="loading" class="text-center">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Anmeldung wird abgeschlossen...</h2>
        <p class="text-gray-600 dark:text-gray-400">{{ statusMessage }}</p>
      </div>

      <div v-else-if="error" class="text-center">
        <div class="text-6xl mb-4">❌</div>
        <h2 class="text-xl font-semibold text-red-900 dark:text-red-300 mb-2">Authentifizierung fehlgeschlagen</h2>
        <p class="text-red-700 dark:text-red-400 mb-6">{{ error }}</p>
        <button
          @click="retry"
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Erneut versuchen
        </button>
      </div>

      <div v-else-if="success" class="text-center">
        <div class="text-6xl mb-4">✅</div>
        <h2 class="text-xl font-semibold text-green-900 dark:text-green-300 mb-2">Erfolgreich angemeldet!</h2>
        <p class="text-green-700 dark:text-green-400 mb-6">Weiterleitung zur App...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useDataStore } from '@/stores/dataStore';
import CloudStorageAdapter from '../adapters/CloudStorageAdapter.js';

const router = useRouter();
const dataStore = useDataStore();
const cloudAdapter = new CloudStorageAdapter();

const loading = ref(true);
const error = ref(null);
const success = ref(false);
const statusMessage = ref('Authentifizierung wird verarbeitet...');

onMounted(async () => {
  // Guard against multiple callback processing using sessionStorage flag
  // This persists across component re-mounts but clears on tab close
  const callbackKey = 'oauth_callback_processing';
  const currentState = new URLSearchParams(window.location.search).get('state');

  // Check if we're already processing this specific callback
  const processingState = sessionStorage.getItem(callbackKey);
  if (processingState === currentState) {
    return;
  }

  // Mark this callback as being processed
  sessionStorage.setItem(callbackKey, currentState);

  try {
    // Get authorization code and state from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const errorParam = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    // Check for OAuth errors
    if (errorParam) {
      throw new Error(errorDescription || `OAuth Fehler: ${errorParam}`);
    }

    // Validate parameters
    if (!code) {
      throw new Error('Autorisierungscode fehlt');
    }

    if (!state) {
      throw new Error('State-Parameter fehlt');
    }

    // Handle callback and exchange code for tokens
    statusMessage.value = 'Tokens werden ausgetauscht...';
    await cloudAdapter.handleCallback(code, state);

    // Switch to cloud storage
    statusMessage.value = 'Cloud-Speicher wird aktiviert...';
    try {
      await dataStore.switchToCloud();
    } catch {
      // If conflict modal is shown, we still redirect but let the modal handle it
    }

    // Success - clear processing flag
    sessionStorage.removeItem(callbackKey);
    success.value = true;
    loading.value = false;

    // Redirect to dashboard after brief delay
    setTimeout(() => {
      router.push('/');
    }, 1000);
  } catch (err) {
    // Error - clear processing flag to allow retry
    sessionStorage.removeItem(callbackKey);
    console.error('OAuth callback error:', err);
    error.value = err.message || 'Authentifizierung fehlgeschlagen. Bitte erneut versuchen.';
    loading.value = false;
  }
});

function retry() {
  router.push('/');
}
</script>
