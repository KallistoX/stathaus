<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex min-h-screen items-center justify-center p-4">
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>

      <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <!-- Header -->
        <div class="mb-4">
          <div class="flex items-center space-x-2 text-blue-600 dark:text-blue-400 mb-2">
            <span class="text-3xl">🔐</span>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Dateizugriff erforderlich
            </h3>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            StatHaus benötigt erneut Zugriff auf
            <strong class="text-gray-900 dark:text-white">"{{ fileName }}"</strong>,
            um deine Daten zu speichern.
          </p>
        </div>

        <!-- Explanation -->
        <div class="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Warum wird das benötigt?
          </h4>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Browser-Sicherheit erfordert, dass du bei jedem Besuch bestätigst,
            dass StatHaus auf deine Datei zugreifen darf. Deine Daten bleiben
            dabei vollständig auf deinem Gerät.
          </p>
        </div>

        <!-- Permission Denied State -->
        <div
          v-if="permissionDenied"
          class="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <p class="text-sm text-red-700 dark:text-red-400">
            Der Zugriff wurde verweigert. Du kannst eine andere Datei wählen
            oder den lokalen Browser-Speicher nutzen.
          </p>
        </div>

        <!-- Actions -->
        <div class="space-y-3">
          <button
            @click="handleGrantAccess"
            :disabled="isRequesting"
            class="w-full px-4 py-3 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors disabled:opacity-50 font-medium"
          >
            <span v-if="isRequesting" class="flex items-center justify-center space-x-2">
              <span class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              <span>Warte auf Bestätigung...</span>
            </span>
            <span v-else>Zugriff gewähren</span>
          </button>

          <div class="flex space-x-3">
            <button
              @click="handleSelectDifferent"
              :disabled="isRequesting"
              class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Andere Datei
            </button>
            <button
              @click="handleUseLocal"
              :disabled="isRequesting"
              class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Lokal speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue'

const props = defineProps({
  fileName: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['granted', 'select-different', 'use-local'])

const isRequesting = ref(false)
const permissionDenied = ref(false)

async function handleGrantAccess() {
  isRequesting.value = true
  permissionDenied.value = false

  // Emit to parent - parent will call requestPermission in user gesture context
  emit('granted')

  // Note: Parent is responsible for closing the modal or showing denied state
  // We keep isRequesting true until parent handles the result
}

function handleSelectDifferent() {
  emit('select-different')
}

function handleUseLocal() {
  emit('use-local')
}
</script>
