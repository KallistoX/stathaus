<template>
  <div
    class="fixed top-16 left-0 right-0 z-40 bg-yellow-50 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-800 px-4 py-3"
  >
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <span class="text-xl">⚠️</span>
        <div>
          <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Dateizugriff nicht möglich
          </p>
          <p class="text-xs text-yellow-700 dark:text-yellow-300">
            Änderungen werden vorübergehend im Browser gespeichert.
          </p>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <button
          @click="handleRetry"
          class="px-3 py-1 text-sm bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 rounded-lg hover:bg-yellow-300 dark:hover:bg-yellow-700 transition-colors"
        >
          Erneut versuchen
        </button>
        <button
          @click="handleDismiss"
          class="p-1 text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 transition-colors"
          title="Schließen"
        >
          ✕
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineEmits } from 'vue'

const emit = defineEmits(['retry', 'dismiss'])

function handleRetry() {
  emit('retry')
}

function handleDismiss() {
  emit('dismiss')
}
</script>
