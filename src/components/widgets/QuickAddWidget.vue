<template>
  <WidgetBase
    title="Schnellerfassung"
    :size="size"
    :show-remove="showRemove"
    @remove="$emit('remove')"
  >
    <div v-if="meters.length > 0" class="space-y-3">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Zähler
        </label>
        <select
          v-model="selectedMeterId"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
        >
          <option value="">Bitte wählen...</option>
          <option v-for="meter in meters" :key="meter.id" :value="meter.id">
            {{ meter.type?.icon }} {{ meter.name }}
          </option>
        </select>
      </div>

      <div v-if="selectedMeterId">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Zählerstand ({{ selectedMeter?.type?.unit }})
        </label>
        <input
          v-model.number="readingValue"
          type="number"
          step="0.01"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          :placeholder="latestValue ? `Letzter Stand: ${latestValue}` : 'Zählerstand eingeben'"
        >
      </div>

      <button
        @click="submitReading"
        :disabled="!canSubmit"
        class="w-full px-4 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
      >
        Speichern
      </button>

      <p v-if="successMessage" class="text-sm text-green-600 dark:text-green-400 text-center">
        {{ successMessage }}
      </p>
    </div>

    <div v-else class="text-center py-4 text-gray-500 dark:text-gray-400">
      <p>Keine Zähler vorhanden</p>
    </div>
  </WidgetBase>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import WidgetBase from './WidgetBase.vue'

defineProps({
  size: {
    type: String,
    default: 'small'
  },
  showRemove: {
    type: Boolean,
    default: true
  }
})

defineEmits(['remove'])

const dataStore = useDataStore()

const selectedMeterId = ref('')
const readingValue = ref(null)
const successMessage = ref('')

const meters = computed(() => dataStore.metersWithTypes)

const selectedMeter = computed(() => {
  if (!selectedMeterId.value) return null
  return dataStore.getMeterWithType(selectedMeterId.value)
})

const latestValue = computed(() => {
  if (!selectedMeterId.value) return null
  const reading = dataStore.getLatestReading(selectedMeterId.value)
  return reading?.value
})

const canSubmit = computed(() => {
  return selectedMeterId.value && readingValue.value !== null && readingValue.value !== ''
})

// Reset value when meter changes
watch(selectedMeterId, () => {
  readingValue.value = null
  successMessage.value = ''
})

function submitReading() {
  if (!canSubmit.value) return

  try {
    dataStore.addReading(
      selectedMeterId.value,
      readingValue.value,
      new Date().toISOString(),
      null,
      null
    )

    successMessage.value = 'Ablesung gespeichert!'
    readingValue.value = null

    // Clear success message after 3 seconds
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (error) {
    alert('Fehler: ' + error.message)
  }
}
</script>
