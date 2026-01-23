<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      Tariff (optional)
    </label>
    <select
      :value="modelValue"
      @change="$emit('update:modelValue', $event.target.value || null)"
      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
    >
      <option value="">No tariff</option>
      <option v-for="tariff in availableTariffs" :key="tariff.id" :value="tariff.id">
        {{ tariff.name }} ({{ formatPrice(tariff.pricePerUnit) }}/{{ unit }})
      </option>
    </select>
    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
      Assign a tariff to calculate costs
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDataStore } from '@/stores/dataStore'

const props = defineProps({
  modelValue: {
    type: String,
    default: null
  },
  meterTypeId: {
    type: String,
    default: null
  }
})

defineEmits(['update:modelValue'])

const dataStore = useDataStore()

const currency = computed(() => dataStore.data?.settings?.currency || 'EUR')

const unit = computed(() => {
  if (!props.meterTypeId) return 'unit'
  const type = dataStore.meterTypes.find(t => t.id === props.meterTypeId)
  return type?.unit || 'unit'
})

const availableTariffs = computed(() => {
  if (!props.meterTypeId) return []
  return dataStore.getTariffsForMeterType(props.meterTypeId)
})

function formatPrice(price) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency.value,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(price)
}
</script>
