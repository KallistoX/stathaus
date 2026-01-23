<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Berichte</h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        Exportiere deine Zählerdaten als PDF
      </p>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <!-- Full Report -->
      <div
        @click="showReportModal = true"
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
      >
        <div class="flex items-center space-x-4">
          <div class="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
            <span class="text-2xl">📄</span>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white">Bericht erstellen</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">Anpassbarer PDF-Export</p>
          </div>
        </div>
      </div>

      <!-- Quick Export Current Month -->
      <div
        @click="quickExportCurrentMonth"
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
      >
        <div class="flex items-center space-x-4">
          <div class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
            <span class="text-2xl">📅</span>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white">Aktueller Monat</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">Schnellexport {{ currentMonthName }}</p>
          </div>
        </div>
      </div>

      <!-- Quick Export Year -->
      <div
        @click="quickExportCurrentYear"
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
      >
        <div class="flex items-center space-x-4">
          <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
            <span class="text-2xl">📊</span>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white">Jahresbericht</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">Schnellexport {{ currentYear }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Export History / Info Section -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Export-Optionen</h2>

      <div class="space-y-4">
        <div class="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <span class="text-xl">📄</span>
          <div>
            <h4 class="font-medium text-gray-900 dark:text-white">PDF-Bericht</h4>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Erstelle einen professionellen PDF-Bericht mit Zusammenfassung, Zählerdetails und Kostenübersicht.
            </p>
          </div>
        </div>

        <div class="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <span class="text-xl">📊</span>
          <div>
            <h4 class="font-medium text-gray-900 dark:text-white">Datenexport</h4>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Exportiere deine Daten als JSON oder CSV in den Einstellungen.
            </p>
            <router-link
              to="/settings"
              class="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              Zu den Einstellungen →
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Report Config Modal -->
    <ReportConfigModal
      v-if="showReportModal"
      @close="showReportModal = false"
      @generated="handleReportGenerated"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import { ReportService } from '@/services/ReportService.js'
import ReportConfigModal from '@/components/ReportConfigModal.vue'

const dataStore = useDataStore()

const showReportModal = ref(false)
const currentYear = new Date().getFullYear()

const currentMonthName = computed(() => {
  return new Date().toLocaleDateString('de-DE', { month: 'long' })
})

async function quickExportCurrentMonth() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const config = {
    title: `Monatsbericht ${currentMonthName.value} ${currentYear}`,
    dateRange: {
      start: startOfMonth.toISOString(),
      end: endOfMonth.toISOString()
    },
    meters: 'all',
    includeCosts: true
  }

  try {
    const doc = await ReportService.generatePDF(config, dataStore)
    const filename = `zaehlerstand-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}.pdf`
    ReportService.downloadPDF(doc, filename)
  } catch (error) {
    console.error('Error generating report:', error)
    alert('Fehler beim Erstellen des Berichts: ' + error.message)
  }
}

async function quickExportCurrentYear() {
  const startOfYear = new Date(currentYear, 0, 1)
  const endOfYear = new Date(currentYear, 11, 31)

  const config = {
    title: `Jahresbericht ${currentYear}`,
    dateRange: {
      start: startOfYear.toISOString(),
      end: endOfYear.toISOString()
    },
    meters: 'all',
    includeCosts: true
  }

  try {
    const doc = await ReportService.generatePDF(config, dataStore)
    const filename = `zaehlerstand-jahresbericht-${currentYear}.pdf`
    ReportService.downloadPDF(doc, filename)
  } catch (error) {
    console.error('Error generating report:', error)
    alert('Fehler beim Erstellen des Berichts: ' + error.message)
  }
}

function handleReportGenerated() {
  showReportModal.value = false
}
</script>
