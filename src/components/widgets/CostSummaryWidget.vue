<template>
  <WidgetBase
    title="Kostenübersicht"
    :size="size"
    :show-remove="showRemove"
    @remove="$emit('remove')"
  >
    <div v-if="metersWithCosts.length > 0" class="space-y-4">
      <!-- Total Costs -->
      <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
        <p class="text-sm text-green-600 dark:text-green-400 mb-1">Gesamtkosten {{ currentYear }}</p>
        <p class="text-2xl font-bold text-green-700 dark:text-green-300">
          {{ formatCurrency(totalYearlyCost) }}
        </p>
      </div>

      <!-- Per Meter Breakdown -->
      <div class="space-y-2">
        <div
          v-for="item in metersWithCosts"
          :key="item.meter.id"
          class="flex items-center justify-between text-sm"
        >
          <div class="flex items-center space-x-2">
            <span>{{ item.meter.type?.icon || '📊' }}</span>
            <span class="text-gray-700 dark:text-gray-300">{{ item.meter.name }}</span>
          </div>
          <span class="font-medium text-gray-900 dark:text-white">
            {{ formatCurrency(item.cost) }}
          </span>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-4 text-gray-500 dark:text-gray-400">
      <p>Keine Tarife zugewiesen</p>
      <p class="text-xs mt-1">Weise Zählern Tarife zu, um Kosten zu sehen</p>
    </div>
  </WidgetBase>
</template>

<script setup>
import { computed } from 'vue'
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
const currentYear = new Date().getFullYear()
const currency = computed(() => dataStore.data?.settings?.currency || 'EUR')

const metersWithCosts = computed(() => {
  return dataStore.metersWithTypes
    .filter(meter => meter.tariffId)
    .map(meter => {
      const cost = dataStore.calculateCost(meter.id)
      return { meter, cost }
    })
    .filter(item => item.cost > 0)
    .sort((a, b) => b.cost - a.cost)
})

const totalYearlyCost = computed(() => {
  return metersWithCosts.value.reduce((sum, item) => sum + item.cost, 0)
})

function formatCurrency(value) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency.value,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}
</script>
