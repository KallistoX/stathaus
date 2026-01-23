<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex min-h-screen items-center justify-center p-4">
      <div class="fixed inset-0 bg-black bg-opacity-30 transition-opacity"></div>

      <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <!-- Warning Header -->
        <div class="flex items-center space-x-3 mb-4">
          <div class="text-yellow-500 text-3xl">⚠️</div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Zahlerstand niedriger als letzte Ablesung
          </h3>
        </div>

        <!-- Warning Content -->
        <div class="mb-6">
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            Der eingegebene Wert ist kleiner als die letzte Ablesung. Bei einem fortlaufenden Zahler ist dies ungewohnlich.
          </p>

          <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">Letzte Ablesung:</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ formatNumber(lastValue) }} {{ unit }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">Neuer Wert:</span>
              <span class="font-medium text-yellow-700 dark:text-yellow-400">{{ formatNumber(newValue) }} {{ unit }}</span>
            </div>
            <div class="flex justify-between text-sm border-t border-yellow-200 dark:border-yellow-700 pt-2">
              <span class="text-gray-600 dark:text-gray-400">Differenz:</span>
              <span class="font-medium text-red-600 dark:text-red-400">{{ formatNumber(newValue - lastValue) }} {{ unit }}</span>
            </div>
          </div>

          <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Mogliche Grunde: Zahlertausch, Korrektur, Ablesefehler bei vorheriger Ablesung.
          </p>
        </div>

        <!-- Actions -->
        <div class="flex space-x-3">
          <button
            @click="$emit('cancel')"
            class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Abbrechen
          </button>
          <button
            @click="$emit('confirm')"
            class="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            Trotzdem speichern
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  lastValue: {
    type: Number,
    required: true
  },
  newValue: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    default: ''
  }
})

defineEmits(['confirm', 'cancel'])

function formatNumber(value) {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value)
}
</script>
