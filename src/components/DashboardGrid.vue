<template>
  <div class="space-y-6">
    <!-- Edit Mode Toggle -->
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Mein Dashboard</h2>
      <div class="flex items-center space-x-2">
        <button
          v-if="!isEditMode && widgets.length > 0"
          @click="isEditMode = true"
          class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          ✏️ Bearbeiten
        </button>
        <button
          v-if="isEditMode"
          @click="isEditMode = false"
          class="px-3 py-1.5 text-sm bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
        >
          ✓ Fertig
        </button>
        <button
          @click="showAddWidget = true"
          class="px-3 py-1.5 text-sm bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
        >
          + Widget
        </button>
      </div>
    </div>

    <!-- Widgets Grid -->
    <div v-if="widgets.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <component
        v-for="(widget, index) in widgets"
        :key="widget.id"
        :is="getWidgetComponent(widget.type)"
        v-bind="getWidgetProps(widget)"
        :show-remove="isEditMode"
        @remove="removeWidget(index)"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
      <div class="text-4xl mb-4">🎨</div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Dashboard anpassen
      </h3>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        Füge Widgets hinzu, um dein persönliches Dashboard zu erstellen
      </p>
      <button
        @click="showAddWidget = true"
        class="px-4 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
      >
        + Widget hinzufügen
      </button>
    </div>

    <!-- Reset to Default -->
    <div v-if="widgets.length > 0" class="flex justify-center">
      <button
        @click="resetToDefault"
        class="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
      >
        Zurück zur Standardansicht
      </button>
    </div>

    <!-- Add Widget Modal -->
    <AddWidgetModal
      v-if="showAddWidget"
      @close="showAddWidget = false"
      @add="addWidget"
    />
  </div>
</template>

<script setup>
import { ref, computed, markRaw } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import AddWidgetModal from '@/components/AddWidgetModal.vue'
import MeterWidget from '@/components/widgets/MeterWidget.vue'
import CostSummaryWidget from '@/components/widgets/CostSummaryWidget.vue'
import PredictionWidget from '@/components/widgets/PredictionWidget.vue'
import QuickAddWidget from '@/components/widgets/QuickAddWidget.vue'

const emit = defineEmits(['reset'])

const dataStore = useDataStore()

const isEditMode = ref(false)
const showAddWidget = ref(false)

const widgets = computed(() => {
  return dataStore.data?.settings?.dashboardWidgets || []
})

const widgetComponents = {
  'meter-card': markRaw(MeterWidget),
  'cost-summary': markRaw(CostSummaryWidget),
  'prediction': markRaw(PredictionWidget),
  'quick-add': markRaw(QuickAddWidget)
}

function getWidgetComponent(type) {
  return widgetComponents[type] || null
}

function getWidgetProps(widget) {
  const props = {
    size: widget.size || 'small'
  }

  if (widget.type === 'meter-card' && widget.config?.meterId) {
    props.meterId = widget.config.meterId
  }

  return props
}

function addWidget(widget) {
  const currentWidgets = [...widgets.value, widget]
  dataStore.updateSettings({ dashboardWidgets: currentWidgets })
  showAddWidget.value = false
}

function removeWidget(index) {
  const currentWidgets = [...widgets.value]
  currentWidgets.splice(index, 1)
  dataStore.updateSettings({ dashboardWidgets: currentWidgets })
}

function resetToDefault() {
  if (confirm('Möchtest du wirklich zur Standardansicht zurückkehren? Alle Widgets werden entfernt.')) {
    dataStore.updateSettings({ dashboardWidgets: [] })
    emit('reset')
  }
}
</script>
