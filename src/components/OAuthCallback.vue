<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full p-8">
      <div v-if="loading" class="text-center">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">Completing sign-in...</h2>
        <p class="text-gray-600">Please wait while we complete your authentication.</p>
      </div>

      <div v-else-if="error" class="text-center">
        <div class="text-6xl mb-4">❌</div>
        <h2 class="text-xl font-semibold text-red-900 mb-2">Authentication Failed</h2>
        <p class="text-red-700 mb-6">{{ error }}</p>
        <button
          @click="retry"
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Try Again
        </button>
      </div>

      <div v-else-if="success" class="text-center">
        <div class="text-6xl mb-4">✅</div>
        <h2 class="text-xl font-semibold text-green-900 mb-2">Authentication Successful!</h2>
        <p class="text-green-700 mb-6">Redirecting to app...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import CloudStorageAdapter from '../adapters/CloudStorageAdapter.js';

const router = useRouter();
const cloudAdapter = new CloudStorageAdapter();

const loading = ref(true);
const error = ref(null);
const success = ref(false);

onMounted(async () => {
  try {
    // Get authorization code and state from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const errorParam = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    // Check for OAuth errors
    if (errorParam) {
      throw new Error(errorDescription || `OAuth error: ${errorParam}`);
    }

    // Validate parameters
    if (!code) {
      throw new Error('Missing authorization code');
    }

    if (!state) {
      throw new Error('Missing state parameter');
    }

    // Handle callback and exchange code for tokens
    await cloudAdapter.handleCallback(code, state);

    // Success!
    success.value = true;
    loading.value = false;

    // Redirect to settings page after 1 second
    setTimeout(() => {
      router.push('/settings');
    }, 1000);
  } catch (err) {
    console.error('OAuth callback error:', err);
    error.value = err.message || 'Authentication failed. Please try again.';
    loading.value = false;
  }
});

function retry() {
  router.push('/settings');
}
</script>
