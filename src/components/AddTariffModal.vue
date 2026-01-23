<template>
  <div class="fixed inset-0 z-50 overflow-y-auto" @click.self="$emit('close')">
    <div class="flex min-h-screen items-center justify-center p-4">
      <div class="fixed inset-0 bg-black bg-opacity-30 transition-opacity"></div>

      <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <!-- Header -->
        <div class="mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Add Tariff</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Create a tariff to calculate costs for your meters
          </p>
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
                placeholder="e.g. Electricity Standard 2024"
              >
            </div>

            <!-- Meter Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Meter Type *
              </label>
              <select
                v-model="form.meterTypeId"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select type...</option>
                <option v-for="type in meterTypes" :key="type.id" :value="type.id">
                  {{ type.icon }} {{ type.name }} ({{ type.unit }})
                </option>
              </select>
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
                  placeholder="0.32"
                >
                <span class="text-gray-500 dark:text-gray-400">{{ currency }}/{{ selectedUnit || 'unit' }}</span>
              </div>
            </div>

            <!-- Base Charge -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Monthly Base Charge (optional)
              </label>
              <div class="flex items-center space-x-2">
                <input
                  v-model.number="form.baseCharge"
                  type="number"
                  step="0.01"
                  min="0"
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="10.00"
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
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leave empty for ongoing tariff
              </p>
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
              Add Tariff
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '@/stores/dataStore'

const emit = defineEmits(['close', 'added'])

const dataStore = useDataStore()

const meterTypes = computed(() => dataStore.meterTypes)
const currency = computed(() => dataStore.data?.settings?.currency || 'EUR')

const selectedUnit = computed(() => {
  if (!form.value.meterTypeId) return null
  const type = meterTypes.value.find(t => t.id === form.value.meterTypeId)
  return type?.unit
})

const form = ref({
  name: '',
  meterTypeId: '',
  pricePerUnit: null,
  baseCharge: 0,
  validFrom: new Date().toISOString().split('T')[0],
  validTo: ''
})

function handleSubmit() {
  try {
    dataStore.addTariff(
      form.value.name,
      form.value.meterTypeId,
      form.value.pricePerUnit,
      form.value.baseCharge || 0,
      form.value.validFrom,
      form.value.validTo || null
    )

    emit('added')
  } catch (error) {
    alert('Error adding tariff: ' + error.message)
  }
}
</script>
