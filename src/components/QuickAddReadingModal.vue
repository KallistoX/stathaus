<template>
  <div class="fixed inset-0 z-50 overflow-y-auto" @click.self="$emit('close')">
    <div class="flex min-h-screen items-center justify-center p-4">
      <div class="fixed inset-0 bg-black bg-opacity-30 transition-opacity"></div>
      
      <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <!-- Header -->
        <div class="mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Ablesung erfassen</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ meter.name }} ({{ meter.type?.unit }})</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit">
          <div class="space-y-4">
            <!-- Value -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Zählerstand *
              </label>
              <input
                v-model="form.value"
                type="number"
                step="0.01"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="z.B. 12345.67"
              >
            </div>

            <!-- Timestamp -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Datum & Uhrzeit
              </label>
              <input
                v-model="form.timestamp"
                type="datetime-local"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
            </div>

            <!-- Note -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notiz (optional)
              </label>
              <textarea
                v-model="form.note"
                rows="2"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="z.B. Jahresablesung"
              ></textarea>
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
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useDataStore } from '@/stores/dataStore'

const props = defineProps({
  meter: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'added'])

const dataStore = useDataStore()

const form = ref({
  value: '',
  timestamp: '',
  note: ''
})

onMounted(() => {
  // Set current datetime as default
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000
  const localISOTime = new Date(now - offset).toISOString().slice(0, 16)
  form.value.timestamp = localISOTime
})

function handleSubmit() {
  try {
    // Convert datetime-local to ISO string
    const timestamp = form.value.timestamp 
      ? new Date(form.value.timestamp).toISOString()
      : null

    dataStore.addReading(
      props.meter.id,
      form.value.value,
      timestamp,
      form.value.note
    )

    emit('added')
  } catch (error) {
    alert('Fehler beim Speichern: ' + error.message)
  }
}
</script>