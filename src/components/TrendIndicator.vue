<template>
  <div
    v-if="trend && trend.direction !== 'insufficient_data'"
    class="flex items-center space-x-1 px-2 py-1 rounded-full text-sm"
    :class="containerClass"
  >
    <span>{{ icon }}</span>
    <span class="font-medium">{{ trend.description }}</span>
    <span v-if="showPercentage && trend.percentage > 0" class="text-xs">
      ({{ formatPercentage(trend.percentage) }})
    </span>
  </div>
  <div
    v-else
    class="flex items-center space-x-1 px-2 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
  >
    <span>📊</span>
    <span>{{ trend?.description || 'Nicht genügend Daten' }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  trend: {
    type: Object,
    required: true
  },
  showPercentage: {
    type: Boolean,
    default: true
  }
})

const icon = computed(() => {
  const icons = {
    increasing: '📈',
    decreasing: '📉',
    stable: '➡️'
  }
  return icons[props.trend?.direction] || '📊'
})

const containerClass = computed(() => {
  const classes = {
    increasing: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    decreasing: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    stable: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
  }
  return classes[props.trend?.direction] || 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
})

function formatPercentage(value) {
  return new Intl.NumberFormat('de-DE', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value / 100)
}
</script>
