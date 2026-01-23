<template>
  <div class="fixed inset-0 z-50 overflow-y-auto" @click.self="$emit('close')">
    <div class="flex min-h-screen items-center justify-center p-4">
      <div class="fixed inset-0 bg-black bg-opacity-30 transition-opacity"></div>

      <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <!-- Header -->
        <div class="mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Edit Tariff</h3>
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
              >
            </div>

            <!-- Price per Unit -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Price per Unit *
              </label>
              <div class="flex items-center space-x-2">
                <input
                  v-model.number="form.pricePerUnit"
                  type="number"
                  step="0.0001"
                  min="0"
                  required
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                <span class="text-gray-500 dark:text-gray-400">{{ currency }}/{{ meterTypeUnit }}</span>
              </div>
            </div>

            <!-- Base Charge -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Monthly Base Charge
              </label>
              <div class="flex items-center space-x-2">
                <input
                  v-model.number="form.baseCharge"
                  type="number"
                  step="0.01"
                  min="0"
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                <span class="text-gray-500 dark:text-gray-400">{{ currency }}/month</span>
              </div>
            </div>

            <!-- Valid From -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Valid From *
              </label>
              <input
                v-model="form.validFrom"
                type="date"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
            </div>

            <!-- Valid To -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Valid Until (optional)
              </label>
              <input
                v-model="form.validTo"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
            </div>
          </div>

          <!-- Actions -->
          <div class="mt-6 flex space-x-3">
            <button
              type="button"
              @click="$emit('close')"
              class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="flex-1 px-4 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '@/stores/dataStore'

const props = defineProps({
  tariff: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'updated'])

const dataStore = useDataStore()

const currency = computed(() => dataStore.data?.settings?.currency || 'EUR')

const meterTypeUnit = computed(() => {
  const type = dataStore.meterTypes.find(t => t.id === props.tariff.meterTypeId)
  return type?.unit || 'unit'
})

const form = ref({
  name: '',
  pricePerUnit: 0,
  baseCharge: 0,
  validFrom: '',
  validTo: ''
})

onMounted(() => {
  form.value = {
    name: props.tariff.name,
    pricePerUnit: props.tariff.pricePerUnit,
    baseCharge: props.tariff.baseCharge || 0,
    validFrom: props.tariff.validFrom,
    validTo: props.tariff.validTo || ''
  }
})

function handleSubmit() {
  try {
    dataStore.updateTariff(props.tariff.id, {
      name: form.value.name,
      pricePerUnit: form.value.pricePerUnit,
      baseCharge: form.value.baseCharge,
      validFrom: form.value.validFrom,
      validTo: form.value.validTo || null
    })
    emit('updated')
  } catch (error) {
    alert('Error saving tariff: ' + error.message)
  }
}
</script>
