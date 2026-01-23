<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Prognose</h3>
      <TrendIndicator :trend="trend" />
    </div>

    <div v-if="hasEnoughData" class="space-y-4">
      <!-- Projected Annual Usage -->
      <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Hochrechnung Jahresverbrauch</p>
        <div class="flex items-baseline space-x-2">
          <span class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ formatNumber(projection.annual) }}
          </span>
          <span class="text-gray-500 dark:text-gray-400">{{ unit }}/Jahr</span>
        </div>
      </div>

      <!-- Average Consumption -->
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Durchschnitt/Tag</p>
          <p class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ formatNumber(projection.daily) }} {{ unit }}
          </p>
        </div>
        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Durchschnitt/Monat</p>
          <p class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ formatNumber(projection.monthly) }} {{ unit }}
          </p>
        </div>
      </div>

      <!-- Year-End Projection -->
      <div v-if="yearEndProjection.value !== null" class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <p class="text-sm text-blue-600 dark:text-blue-400 mb-1">Prognose Jahresende {{ currentYear }}</p>
        <div class="flex items-baseline space-x-2">
          <span class="text-xl font-bold text-blue-700 dark:text-blue-300">
            {{ formatNumber(yearEndProjection.value) }}
          </span>
          <span class="text-blue-600 dark:text-blue-400">{{ unit }}</span>
        </div>
        <p class="text-xs text-blue-500 dark:text-blue-400 mt-1">
          Noch {{ yearEndProjection.daysDiff }} Tage
        </p>
      </div>

      <!-- Confidence Indicator -->
      <div class="flex items-center space-x-2 text-sm">
        <span :class="confidenceClass" class="flex items-center space-x-1">
          <span class="w-2 h-2 rounded-full" :class="confidenceDotClass"></span>
          <span>{{ confidenceText }}</span>
        </span>
      </div>
    </div>

    <div v-else class="text-center py-6 text-gray-500 dark:text-gray-400">
      <p class="text-sm">Mindestens 2 Ablesungen erforderlich</p>
      <p class="text-xs mt-1">Für bessere Prognosen: 6+ Ablesungen empfohlen</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { PredictionService } from '@/services/PredictionService.js'
import TrendIndicator from '@/components/TrendIndicator.vue'

const props = defineProps({
  readings: {
    type: Array,
    required: true
  },
  unit: {
    type: String,
    default: 'Einheit'
  }
})

const currentYear = new Date().getFullYear()

const hasEnoughData = computed(() => {
  return props.readings && props.readings.length >= 2
})

const projection = computed(() => {
  return PredictionService.projectAnnualUsage(props.readings)
})

const trend = computed(() => {
  return PredictionService.analyzeTrend(props.readings)
})

const yearEndProjection = computed(() => {
  return PredictionService.getYearEndProjection(props.readings)
})

const confidenceClass = computed(() => {
  const confidence = projection.value.confidence
  return {
    high: 'text-green-600 dark:text-green-400',
    medium: 'text-yellow-600 dark:text-yellow-400',
    low: 'text-red-600 dark:text-red-400'
  }[confidence] || 'text-gray-500 dark:text-gray-400'
})

const confidenceDotClass = computed(() => {
  const confidence = projection.value.confidence
  return {
    high: 'bg-green-500',
    medium: 'bg-yellow-500',
    low: 'bg-red-500'
  }[confidence] || 'bg-gray-500'
})

const confidenceText = computed(() => {
  return PredictionService.getConfidenceDescription(projection.value.confidence)
})

function formatNumber(value) {
  if (value == null || isNaN(value)) return '-'
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  }).format(value)
}
</script>
