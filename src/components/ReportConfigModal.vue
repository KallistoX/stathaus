<template>
  <div class="fixed inset-0 z-50 overflow-y-auto" @click.self="$emit('close')">
    <div class="flex min-h-screen items-center justify-center p-4">
      <div class="fixed inset-0 bg-black bg-opacity-30 transition-opacity"></div>

      <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6">
        <!-- Header -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">PDF-Bericht erstellen</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Konfiguriere deinen Bericht
          </p>
        </div>

        <!-- Form -->
        <div class="space-y-5">
          <!-- Title -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titel
            </label>
            <input
              v-model="config.title"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Zählerstand-Bericht"
            >
          </div>

          <!-- Date Range -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Zeitraum
            </label>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs text-gray-500 dark:text-gray-400">Von</label>
                <input
                  v-model="config.dateRange.start"
                  type="date"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
              </div>
              <div>
                <label class="text-xs text-gray-500 dark:text-gray-400">Bis</label>
                <input
                  v-model="config.dateRange.end"
                  type="date"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
              </div>
            </div>
          </div>

          <!-- Meter Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Zähler
            </label>
            <div class="space-y-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-3">
              <label class="flex items-center space-x-2">
                <input
                  type="checkbox"
                  v-model="selectAllMeters"
                  @change="toggleAllMeters"
                  class="w-4 h-4 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
                >
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Alle Zähler</span>
              </label>
              <div class="border-t border-gray-200 dark:border-gray-600 mt-2 pt-2">
                <label
                  v-for="meter in meters"
                  :key="meter.id"
                  class="flex items-center space-x-2 py-1"
                >
                  <input
                    type="checkbox"
                    v-model="config.meters"
                    :value="meter.id"
                    class="w-4 h-4 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
                  >
                  <span class="text-sm text-gray-600 dark:text-gray-400">
                    {{ meter.type?.icon }} {{ meter.name }}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <!-- Options -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Optionen
            </label>
            <div class="space-y-2">
              <label class="flex items-center space-x-2">
                <input
                  type="checkbox"
                  v-model="config.includeCosts"
                  class="w-4 h-4 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
                >
                <span class="text-sm text-gray-600 dark:text-gray-400">Kosten einbeziehen</span>
              </label>
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
            @click="generateReport"
            :disabled="isGenerating || config.meters.length === 0"
            class="flex-1 px-4 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isGenerating ? 'Generiere...' : 'PDF erstellen' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import { ReportService } from '@/services/ReportService.js'

const emit = defineEmits(['close', 'generated'])

const dataStore = useDataStore()

const meters = computed(() => dataStore.metersWithTypes)
const selectAllMeters = ref(true)
const isGenerating = ref(false)

const config = ref({
  title: 'Zählerstand-Bericht',
  dateRange: {
    start: '',
    end: ''
  },
  meters: meters.value.map(m => m.id),
  includeCosts: true
})

// Watch for meter changes
watch(meters, (newMeters) => {
  if (selectAllMeters.value) {
    config.value.meters = newMeters.map(m => m.id)
  }
}, { immediate: true })

// Check if all meters are selected
watch(() => config.value.meters, (selected) => {
  selectAllMeters.value = selected.length === meters.value.length
})

function toggleAllMeters() {
  if (selectAllMeters.value) {
    config.value.meters = meters.value.map(m => m.id)
  } else {
    config.value.meters = []
  }
}

async function generateReport() {
  if (config.value.meters.length === 0) return

  isGenerating.value = true

  try {
    const reportConfig = {
      title: config.value.title || 'Zählerstand-Bericht',
      dateRange: {
        start: config.value.dateRange.start || null,
        end: config.value.dateRange.end || null
      },
      meters: config.value.meters,
      includeCosts: config.value.includeCosts
    }

    const doc = await ReportService.generatePDF(reportConfig, dataStore)

    // Generate filename
    const dateStr = new Date().toISOString().split('T')[0]
    const filename = `zaehlerstand-bericht-${dateStr}.pdf`

    ReportService.downloadPDF(doc, filename)

    emit('generated')
  } catch (error) {
    console.error('Error generating report:', error)
    alert('Fehler beim Erstellen des Berichts: ' + error.message)
  } finally {
    isGenerating.value = false
  }
}
</script>
