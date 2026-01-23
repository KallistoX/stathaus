<template>
  <WidgetBase
    title="Prognosen"
    :size="size"
    :show-remove="showRemove"
    @remove="$emit('remove')"
  >
    <div v-if="metersWithPredictions.length > 0" class="space-y-4">
      <div
        v-for="item in metersWithPredictions"
        :key="item.meter.id"
        class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center space-x-2">
            <span>{{ item.meter.type?.icon || '📊' }}</span>
            <span class="font-medium text-gray-900 dark:text-white text-sm">{{ item.meter.name }}</span>
          </div>
          <TrendIndicator :trend="item.trend" :show-percentage="false" />
        </div>
        <div class="flex items-baseline justify-between">
          <span class="text-lg font-bold text-gray-900 dark:text-white">
            {{ formatNumber(item.projection.annual) }}
          </span>
          <span class="text-xs text-gray-500 dark:text-gray-400">
            {{ item.meter.type?.unit }}/Jahr
          </span>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-4 text-gray-500 dark:text-gray-400">
      <p>Keine Prognosen verfügbar</p>
      <p class="text-xs mt-1">Mindestens 2 Ablesungen pro Zähler erforderlich</p>
    </div>
  </WidgetBase>
</template>

<script setup>
import { computed } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import { PredictionService } from '@/services/PredictionService.js'
import WidgetBase from './WidgetBase.vue'
import TrendIndicator from '@/components/TrendIndicator.vue'

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

const metersWithPredictions = computed(() => {
  return dataStore.metersWithTypes
    .map(meter => {
      const readings = dataStore.getReadingsForMeter(meter.id)
      if (readings.length < 2) return null

      const projection = PredictionService.projectAnnualUsage(readings)
      const trend = PredictionService.analyzeTrend(readings)

      return { meter, projection, trend }
    })
    .filter(item => item !== null)
    .slice(0, 5) // Limit to 5 meters
})

function formatNumber(value) {
  if (value == null || isNaN(value)) return '-'
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}
</script>
