<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex min-h-screen items-center justify-center p-4">
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>

      <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <!-- Header -->
        <div class="mb-4">
          <div class="flex items-center space-x-2 text-yellow-600 dark:text-yellow-500 mb-2">
            <span class="text-3xl">⚠️</span>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Datei nicht gefunden</h3>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ fileName ? `Die Datei "${fileName}"` : 'Die zuvor verwendete Datei' }}
            wurde gelöscht oder ist nicht mehr verfügbar.
          </p>
        </div>

        <!-- Options -->
        <div class="space-y-3 mb-6">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Wie möchten Sie vorgehen?
          </p>

          <button
            @click="handleSelectFile"
            class="w-full text-left px-4 py-3 bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-200 dark:border-primary-800 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors group"
          >
            <div class="flex items-start space-x-3">
              <span class="text-2xl">📁</span>
              <div class="flex-1">
                <div class="font-medium text-gray-900 dark:text-white">Anderen Speicherort wählen</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  Vielleicht wurde die Datei verschoben
                </div>
              </div>
            </div>
          </button>

          <button
            @click="handleCreateNew"
            class="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div class="flex items-start space-x-3">
              <span class="text-2xl">📄</span>
              <div class="flex-1">
                <div class="font-medium text-gray-900 dark:text-white">Neue leere Datei erstellen</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  Beginne mit einer neuen Datei
                </div>
              </div>
            </div>
          </button>

          <button
            @click="handleUseLocal"
            class="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div class="flex items-start space-x-3">
              <span class="text-2xl">💾</span>
              <div class="flex-1">
                <div class="font-medium text-gray-900 dark:text-white">Zu lokalem Speicher wechseln</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  Verwende den Browser-Speicher (IndexedDB)
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  fileName: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['select-file', 'create-new', 'use-local'])

function handleSelectFile() {
  emit('select-file')
}

function handleCreateNew() {
  emit('create-new')
}

function handleUseLocal() {
  emit('use-local')
}
</script>
