<template>
  <div class="fixed inset-0 z-50 overflow-y-auto" @click.self="$emit('close')">
    <div class="flex min-h-screen items-center justify-center p-4">
      <div class="fixed inset-0 bg-black bg-opacity-30 transition-opacity"></div>

      <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <!-- Header -->
        <div class="mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Widget hinzufügen</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Wähle ein Widget für dein Dashboard
          </p>
        </div>

        <!-- Widget Options -->
        <div class="space-y-3 mb-6">
          <button
            v-for="widget in availableWidgets"
            :key="widget.type"
            @click="selectWidget(widget)"
            class="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <div class="flex items-center space-x-3">
              <span class="text-2xl">{{ widget.icon }}</span>
              <div>
                <p class="font-medium text-gray-900 dark:text-white">{{ widget.name }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ widget.description }}</p>
              </div>
            </div>
          </button>
        </div>

        <!-- Meter Selection (for meter widget) -->
        <div v-if="selectedWidgetType === 'meter-card'" class="mb-6">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Zähler auswählen
          </label>
          <select
            v-model="selectedMeterId"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Bitte wählen...</option>
            <option v-for="meter in meters" :key="meter.id" :value="meter.id">
              {{ meter.type?.icon }} {{ meter.name }}
            </option>
          </select>
        </div>

        <!-- Actions -->
        <div class="flex space-x-3">
          <button
            type="button"
            @click="$emit('close')"
            class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Abbrechen
          </button>
          <button
            @click="addWidget"
            :disabled="!canAdd"
            class="flex-1 px-4 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hinzufügen
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '@/stores/dataStore'

const emit = defineEmits(['close', 'add'])

const dataStore = useDataStore()

const selectedWidgetType = ref('')
const selectedMeterId = ref('')

const meters = computed(() => dataStore.metersWithTypes)

const availableWidgets = [
  {
    type: 'meter-card',
    name: 'Zähler-Karte',
    icon: '📊',
    description: 'Zeigt einen einzelnen Zähler mit aktuellem Stand'
  },
  {
    type: 'cost-summary',
    name: 'Kostenübersicht',
    icon: '💰',
    description: 'Gesamtkosten aller Zähler mit Tarifen'
  },
  {
    type: 'prediction',
    name: 'Prognosen',
    icon: '📈',
    description: 'Verbrauchsprognosen und Trends'
  },
  {
    type: 'quick-add',
    name: 'Schnellerfassung',
    icon: '⚡',
    description: 'Schnell eine neue Ablesung erfassen'
  }
]

const canAdd = computed(() => {
  if (!selectedWidgetType.value) return false
  if (selectedWidgetType.value === 'meter-card' && !selectedMeterId.value) return false
  return true
})

function selectWidget(widget) {
  selectedWidgetType.value = widget.type
  selectedMeterId.value = ''
}

function addWidget() {
  if (!canAdd.value) return

  const widget = {
    id: `widget-${Date.now()}`,
    type: selectedWidgetType.value,
    size: 'small',
    config: {}
  }

  if (selectedWidgetType.value === 'meter-card') {
    widget.config.meterId = selectedMeterId.value
  }

  emit('add', widget)
}
</script>
