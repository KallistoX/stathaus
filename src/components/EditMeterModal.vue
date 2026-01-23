<template>
  <div class="fixed inset-0 z-50 overflow-y-auto" @click.self="$emit('close')">
    <div class="flex min-h-screen items-center justify-center p-4">
      <div class="fixed inset-0 bg-black bg-opacity-30 transition-opacity"></div>

      <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <!-- Header -->
        <div class="mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Zahler bearbeiten</h3>
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

            <!-- Meter Number -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Zahlernummer (optional)
              </label>
              <input
                v-model="form.meterNumber"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
            </div>

            <!-- Location -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Standort (optional)
              </label>
              <input
                v-model="form.location"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
            </div>

            <!-- Group -->
            <GroupSelector v-model="form.groupId" />

            <!-- Tariff -->
            <TariffSelector
              v-model="form.tariffId"
              :meter-type-id="meter.typeId"
            />

            <!-- Continuous Meter Checkbox -->
            <div class="flex items-start space-x-3">
              <input
                v-model="form.isContinuous"
                type="checkbox"
                id="editIsContinuous"
                class="mt-1 w-4 h-4 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
              >
              <label for="editIsContinuous" class="text-sm text-gray-700 dark:text-gray-300">
                <span class="font-medium">Fortlaufender Zahler</span>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Warnung anzeigen, wenn der neue Zahlerstand niedriger als die letzte Ablesung ist
                </p>
              </label>
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
              type="submit"
              class="flex-1 px-4 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
            >
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import GroupSelector from '@/components/GroupSelector.vue'
import TariffSelector from '@/components/TariffSelector.vue'

const props = defineProps({
  meter: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'updated'])

const dataStore = useDataStore()

const form = ref({
  name: '',
  meterNumber: '',
  location: '',
  isContinuous: false,
  groupId: null,
  tariffId: null
})

onMounted(() => {
  // Initialize form with current meter values
  form.value = {
    name: props.meter.name,
    meterNumber: props.meter.meterNumber || '',
    location: props.meter.location || '',
    isContinuous: props.meter.isContinuous || false,
    groupId: props.meter.groupId || null,
    tariffId: props.meter.tariffId || null
  }
})

function handleSubmit() {
  try {
    dataStore.updateMeter(props.meter.id, {
      name: form.value.name,
      meterNumber: form.value.meterNumber,
      location: form.value.location,
      isContinuous: form.value.isContinuous,
      groupId: form.value.groupId,
      tariffId: form.value.tariffId
    })
    emit('updated')
  } catch (error) {
    alert('Fehler beim Speichern: ' + error.message)
  }
}
</script>
