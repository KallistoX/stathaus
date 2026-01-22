<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Zähler</h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Verwalte deine Strom-, Wasser- und Gaszähler
        </p>
      </div>
      <button
        @click="showAddMeter = true"
        class="hidden md:flex items-center px-4 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
      >
        <span class="mr-2">+</span>
        Zähler hinzufügen
      </button>
    </div>

    <!-- Meters List -->
    <div v-if="metersWithTypes.length === 0" class="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div class="text-6xl mb-4">⚡</div>
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Noch keine Zähler vorhanden
      </h3>
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        Lege deinen ersten Zähler an
      </p>
      <button
        @click="showAddMeter = true"
        class="inline-flex items-center px-6 py-3 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
      >
        <span class="mr-2">+</span>
        Zähler hinzufügen
      </button>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="meter in metersWithTypes"
        :key="meter.id"
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
      >
        <div class="flex items-start justify-between">
          <!-- Meter Info -->
          <div class="flex items-start space-x-4 flex-1">
            <div class="text-3xl">{{ meter.type?.icon || '📊' }}</div>
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ meter.name }}</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ meter.type?.name }}</p>

              <div class="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <div v-if="meter.meterNumber">
                  <span class="font-medium">Zählernummer:</span> {{ meter.meterNumber }}
                </div>
                <div v-if="meter.location">
                  <span class="font-medium">Standort:</span> {{ meter.location }}
                </div>
              </div>

              <!-- Latest Reading -->
              <div v-if="getLatestReading(meter.id)" class="mt-4 inline-flex items-baseline space-x-2 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
                <span class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ formatNumber(getLatestReading(meter.id).value) }}
                </span>
                <span class="text-sm text-gray-500 dark:text-gray-400">{{ meter.type?.unit }}</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-start space-x-2">
            <button
              @click="$router.push(`/meters/${meter.id}`)"
              class="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Details anzeigen"
            >
              📊
            </button>
            <button
              @click="confirmDelete(meter)"
              class="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Zähler löschen"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile FAB -->
    <button
      @click="showAddMeter = true"
      class="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary-600 dark:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
    >
      +
    </button>

    <!-- Add Meter Modal -->
    <AddMeterModal
      v-if="showAddMeter"
      @close="showAddMeter = false"
      @added="handleMeterAdded"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import AddMeterModal from '@/components/AddMeterModal.vue'

const dataStore = useDataStore()

const showAddMeter = ref(false)
const metersWithTypes = computed(() => dataStore.metersWithTypes)

function getLatestReading(meterId) {
  return dataStore.getLatestReading(meterId)
}

function formatNumber(value) {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value)
}

function confirmDelete(meter) {
  if (confirm(`Zähler "${meter.name}" wirklich löschen? Alle Ablesungen gehen verloren.`)) {
    try {
      dataStore.deleteMeter(meter.id)
    } catch (error) {
      alert('Fehler beim Löschen: ' + error.message)
    }
  }
}

function handleMeterAdded() {
  showAddMeter.value = false
}
</script>