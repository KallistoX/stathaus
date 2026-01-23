<template>
  <WidgetBase
    :title="meter?.name || 'Zähler'"
    :size="size"
    :show-remove="showRemove"
    @remove="$emit('remove')"
  >
    <div v-if="meter" class="space-y-3">
      <div class="flex items-center space-x-3">
        <span class="text-2xl">{{ meter.type?.icon || '📊' }}</span>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ meter.type?.name }}</p>
          <p v-if="meter.location" class="text-xs text-gray-400 dark:text-gray-500">📍 {{ meter.location }}</p>
        </div>
      </div>

      <div v-if="latestReading" class="space-y-2">
        <div class="flex items-baseline justify-between">
          <span class="text-3xl font-bold text-gray-900 dark:text-white">
            {{ formatNumber(latestReading.value) }}
          </span>
          <span class="text-sm text-gray-500 dark:text-gray-400">{{ meter.type?.unit }}</span>
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ formatDate(latestReading.timestamp) }}
        </p>
      </div>
      <div v-else class="text-gray-400 dark:text-gray-500 text-sm">
        Keine Ablesung vorhanden
      </div>

      <button
        @click="$router.push(`/meters/${meter.id}`)"
        class="w-full text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
      >
        Details anzeigen →
      </button>
    </div>
    <div v-else class="text-center py-4 text-gray-500 dark:text-gray-400">
      Zähler nicht gefunden
    </div>
  </WidgetBase>
</template>

<script setup>
import { computed } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import WidgetBase from './WidgetBase.vue'

const props = defineProps({
  meterId: {
    type: String,
    required: true
  },
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

const meter = computed(() => {
  return dataStore.getMeterWithType(props.meterId)
})

const latestReading = computed(() => {
  return dataStore.getLatestReading(props.meterId)
})

function formatNumber(value) {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value)
}

function formatDate(timestamp) {
  const date = new Date(timestamp)
  const now = new Date()
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Heute'
  if (diffDays === 1) return 'Gestern'
  if (diffDays < 7) return `vor ${diffDays} Tagen`

  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}
</script>
