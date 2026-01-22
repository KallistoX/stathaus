<template>
  <div class="fixed inset-0 z-50 overflow-y-auto" @click.self="$emit('close')">
    <div class="flex min-h-screen items-center justify-center p-4">
      <div class="fixed inset-0 bg-black bg-opacity-30 transition-opacity"></div>
      
      <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <!-- Header -->
        <div class="mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Zählertyp hinzufügen</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Definiere einen neuen Zählertyp (z.B. Heizöl, Solar, etc.)
          </p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit">
          <div class="space-y-4">
            <!-- Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name *
              </label>
              <input
                v-model="form.name"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="z.B. Strom, Wasser, Gas, Heizöl"
              >
            </div>

            <!-- Unit -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Einheit *
              </label>
              <input
                v-model="form.unit"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="z.B. kWh, m³, Liter"
              >
            </div>

            <!-- Icon -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Icon (Emoji)
              </label>
              <div class="flex space-x-2">
                <input
                  v-model="form.icon"
                  type="text"
                  maxlength="2"
                  class="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-center text-2xl"
                  placeholder="⚡"
                >
                <div class="flex-1 text-sm text-gray-600 dark:text-gray-400 flex items-center">
                  Wähle ein passendes Emoji
                </div>
              </div>

              <!-- Common Icons -->
              <div class="mt-2 flex flex-wrap gap-2">
                <button
                  v-for="emoji in commonIcons"
                  :key="emoji"
                  type="button"
                  @click="form.icon = emoji"
                  class="text-2xl p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  :class="{ 'bg-primary-100 dark:bg-primary-900/30': form.icon === emoji }"
                >
                  {{ emoji }}
                </button>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="mt-6 flex space-x-3">
            <button
              type="button"
              @click="$emit('close')"
              class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              class="flex-1 px-4 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
            >
              Hinzufügen
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useDataStore } from '@/stores/dataStore'

const emit = defineEmits(['close', 'added'])

const dataStore = useDataStore()

const commonIcons = ['⚡', '💧', '🔥', '🛢️', '☀️', '🌡️', '📊', '💨', '🏠', '🔋']

const form = ref({
  name: '',
  unit: '',
  icon: '📊'
})

function handleSubmit() {
  try {
    dataStore.addMeterType(
      form.value.name,
      form.value.unit,
      form.value.icon
    )

    emit('added')
  } catch (error) {
    alert('Fehler beim Hinzufügen: ' + error.message)
  }
}
</script>