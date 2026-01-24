<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div v-if="!meter" class="text-center py-16">
      <p class="text-gray-600 dark:text-gray-400">Zähler nicht gefunden</p>
      <router-link to="/meters" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mt-4 inline-block">
        Zurück zur Übersicht
      </router-link>
    </div>

    <div v-else>
      <!-- Header -->
      <div class="mb-8">
        <router-link to="/meters" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mb-4 inline-block">
          ← Zurück
        </router-link>
        <div class="flex items-start justify-between">
          <div class="flex items-center space-x-3">
            <span class="text-4xl">{{ meter.type?.icon || '📊' }}</span>
            <div>
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white">{{ meter.name }}</h1>
              <p class="text-gray-600 dark:text-gray-400 mt-1">{{ meter.type?.name }}</p>
              <p v-if="meter.location" class="text-sm text-gray-500 dark:text-gray-400 mt-1">📍 {{ meter.location }}</p>
            </div>
          </div>
          <div class="flex space-x-2">
            <button
              @click="showEditMeter = true"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              ✏️ Bearbeiten
            </button>
            <button
              @click="showAddReading = true"
              class="px-4 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
            >
              + Ablesung
            </button>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Aktueller Stand</h3>
          <div class="flex items-baseline space-x-2">
            <span class="text-3xl font-bold text-gray-900 dark:text-white">
              {{ latestReading ? formatNumber(latestReading.value) : '-' }}
            </span>
            <span class="text-gray-500 dark:text-gray-400">{{ meter.type?.unit }}</span>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Anzahl Ablesungen</h3>
          <div class="text-3xl font-bold text-gray-900 dark:text-white">{{ readings.length }}</div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Letzte Ablesung</h3>
          <div class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ latestReading ? formatDate(latestReading.timestamp) : '-' }}
          </div>
        </div>
      </div>

      <!-- Cost Summary (if tariff assigned) -->
      <div v-if="meter.tariffId && tariff" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Kosten & Verbrauch</h2>
          <span class="text-sm text-gray-500 dark:text-gray-400">
            Tarif: {{ tariff.name }}
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Total Consumption -->
          <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Gesamtverbrauch</h3>
            <div class="flex items-baseline space-x-2">
              <span class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ formatNumber(consumption) }}
              </span>
              <span class="text-gray-500 dark:text-gray-400">{{ meter.type?.unit }}</span>
            </div>
          </div>

          <!-- Total Cost -->
          <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Gesamtkosten</h3>
            <div class="flex items-baseline space-x-2">
              <span class="text-2xl font-bold text-green-600 dark:text-green-400">
                {{ formatCurrency(totalCost) }}
              </span>
            </div>
          </div>

          <!-- Price per Unit -->
          <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Preis pro {{ meter.type?.unit }}</h3>
            <div class="flex items-baseline space-x-2">
              <span class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ formatCurrency(tariff.pricePerUnit) }}
              </span>
            </div>
            <p v-if="tariff.baseCharge > 0" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              + {{ formatCurrency(tariff.baseCharge) }} Grundgebühr/Monat
            </p>
          </div>
        </div>

        <!-- Year selector for monthly breakdown -->
        <div class="mt-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-md font-medium text-gray-700 dark:text-gray-300">Monatsübersicht {{ selectedYear }}</h3>
            <div class="flex items-center space-x-2">
              <button
                @click="selectedYear--"
                class="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ←
              </button>
              <span class="text-sm text-gray-600 dark:text-gray-400">{{ selectedYear }}</span>
              <button
                @click="selectedYear++"
                :disabled="selectedYear >= currentYear"
                class="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50"
              >
                →
              </button>
            </div>
          </div>

          <div v-if="monthlyBreakdown.length > 0" class="overflow-x-auto">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">
              <span class="italic">~Kursive Werte</span> sind Schätzungen basierend auf dem Tagesverbrauch
            </p>
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-600">
                  <th class="text-left py-2 text-gray-500 dark:text-gray-400">Monat</th>
                  <th class="text-right py-2 text-gray-500 dark:text-gray-400">Verbrauch</th>
                  <th class="text-right py-2 text-gray-500 dark:text-gray-400">Kosten</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="month in monthlyBreakdown"
                  :key="month.month"
                  class="border-b border-gray-100 dark:border-gray-700"
                  :class="{ 'opacity-70 italic': month.isEstimated }"
                >
                  <td class="py-2 text-gray-900 dark:text-white">
                    <span v-if="month.isEstimated">~</span>{{ month.monthName }}
                  </td>
                  <td class="py-2 text-right text-gray-700 dark:text-gray-300">
                    <span v-if="month.isEstimated">~</span>{{ formatNumber(month.consumption) }} {{ meter.type?.unit }}
                  </td>
                  <td class="py-2 text-right font-medium text-green-600 dark:text-green-400">
                    <span v-if="month.isEstimated">~</span>{{ formatCurrency(month.cost) }}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="border-t-2 border-gray-300 dark:border-gray-500">
                  <td class="py-2 font-semibold text-gray-900 dark:text-white">Gesamt</td>
                  <td class="py-2 text-right font-semibold text-gray-900 dark:text-white">
                    {{ formatNumber(yearlyTotalConsumption) }} {{ meter.type?.unit }}
                  </td>
                  <td class="py-2 text-right font-semibold text-green-600 dark:text-green-400">
                    {{ formatCurrency(yearlyTotalCost) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p v-else class="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            Keine Daten für {{ selectedYear }} vorhanden
          </p>
        </div>
      </div>

      <!-- No Tariff Info -->
      <div v-else-if="readings.length >= 2" class="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4 mb-8">
        <p class="text-sm text-blue-800 dark:text-blue-300">
          💡 Weise diesem Zähler einen Tarif zu, um Kosten berechnen zu lassen.
          <button
            @click="showEditMeter = true"
            class="underline hover:no-underline ml-1"
          >
            Zähler bearbeiten
          </button>
        </p>
      </div>

      <!-- Chart -->
      <div v-if="readings.length > 0" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Verlauf</h2>
        <v-chart :option="chartOption" autoresize class="h-80" />
      </div>

      <!-- Prediction Card -->
      <div v-if="readings.length >= 2" class="mb-8">
        <PredictionCard :readings="readings" :unit="meter.type?.unit || 'Einheit'" />
      </div>

      <!-- Readings History -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ablesungen</h2>

        <div v-if="readings.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
          Noch keine Ablesungen vorhanden
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="reading in sortedReadings"
            :key="reading.id"
            class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <div class="flex-1">
              <div class="flex items-baseline space-x-3">
                <span class="text-xl font-bold text-gray-900 dark:text-white">
                  {{ formatNumber(reading.value) }}
                </span>
                <span class="text-sm text-gray-500 dark:text-gray-400">{{ meter.type?.unit }}</span>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {{ formatDateLong(reading.timestamp) }}
              </p>
              <p v-if="reading.note" class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {{ reading.note }}
              </p>
            </div>
            <button
              @click="confirmDeleteReading(reading)"
              class="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Löschen"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      <!-- Add Reading Modal -->
      <QuickAddReadingModal
        v-if="showAddReading"
        :meter="meter"
        @close="showAddReading = false"
        @added="handleReadingAdded"
      />

      <!-- Edit Meter Modal -->
      <EditMeterModal
        v-if="showEditMeter && meter"
        :meter="meter"
        @close="showEditMeter = false"
        @updated="handleMeterUpdated"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useDataStore } from '@/stores/dataStore'
import QuickAddReadingModal from '@/components/QuickAddReadingModal.vue'
import EditMeterModal from '@/components/EditMeterModal.vue'
import PredictionCard from '@/components/PredictionCard.vue'

const route = useRoute()
const dataStore = useDataStore()

const showAddReading = ref(false)
const showEditMeter = ref(false)
const currentYear = new Date().getFullYear()
const selectedYear = ref(currentYear)

const meter = computed(() => {
  const meterId = route.params.id
  return dataStore.getMeterWithType(meterId)
})

const readings = computed(() => {
  if (!meter.value) return []
  return dataStore.getReadingsForMeter(meter.value.id)
})

const sortedReadings = computed(() => {
  return [...readings.value].reverse() // Neueste zuerst
})

const latestReading = computed(() => {
  return readings.value.length > 0 ? readings.value[readings.value.length - 1] : null
})

// Cost calculation computed properties
const tariff = computed(() => {
  if (!meter.value?.tariffId) return null
  return dataStore.getTariff(meter.value.tariffId)
})

const consumption = computed(() => {
  if (!meter.value) return 0
  const result = dataStore.calculateConsumption(meter.value.id)
  return result?.consumption || 0
})

const totalCost = computed(() => {
  if (!meter.value) return 0
  const result = dataStore.calculateCost(meter.value.id)
  return result?.cost || 0
})

const monthlyBreakdown = computed(() => {
  if (!meter.value) return []
  const breakdown = dataStore.getMonthlyBreakdown(meter.value.id, selectedYear.value)
  const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
  return breakdown
    .filter(m => m.consumption > 0 || m.cost > 0)
    .map(m => ({
      ...m,
      monthName: monthNames[m.month - 1]
    }))
})

const yearlyTotalConsumption = computed(() => {
  return monthlyBreakdown.value.reduce((sum, m) => sum + m.consumption, 0)
})

const yearlyTotalCost = computed(() => {
  return monthlyBreakdown.value.reduce((sum, m) => sum + m.cost, 0)
})

const currency = computed(() => dataStore.data?.settings?.currency || 'EUR')

const chartOption = computed(() => {
  if (readings.value.length === 0) return {}

  const isDark = dataStore.theme === 'dark'
  const textColor = isDark ? '#e5e7eb' : '#374151'
  const gridColor = isDark ? '#374151' : '#e5e7eb'

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderColor: isDark ? '#374151' : '#e5e7eb',
      textStyle: {
        color: textColor
      },
      formatter: (params) => {
        const date = new Date(params[0].value[0]).toLocaleDateString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
        const value = formatNumber(params[0].value[1])
        return `${date}<br/>Stand: ${value} ${meter.value.type?.unit}`
      }
    },
    xAxis: {
      type: 'time',
      axisLine: {
        lineStyle: {
          color: gridColor
        }
      },
      axisLabel: {
        color: textColor,
        formatter: (value) => {
          return new Date(value).toLocaleDateString('de-DE', {
            month: 'short',
            year: '2-digit'
          })
        }
      },
      splitLine: {
        lineStyle: {
          color: gridColor
        }
      }
    },
    yAxis: {
      type: 'value',
      name: `Zählerstand (${meter.value.type?.unit})`,
      nameTextStyle: {
        color: textColor
      },
      axisLine: {
        lineStyle: {
          color: gridColor
        }
      },
      axisLabel: {
        color: textColor,
        formatter: (value) => formatNumber(value)
      },
      splitLine: {
        lineStyle: {
          color: gridColor
        }
      }
    },
    series: [{
      type: 'line',
      smooth: true,
      data: readings.value.map(r => [r.timestamp, r.value]),
      itemStyle: {
        color: '#3b82f6'
      },
      lineStyle: {
        color: '#3b82f6'
      },
      areaStyle: {
        color: '#3b82f6',
        opacity: 0.1
      },
      symbol: 'circle',
      symbolSize: 8
    }],
    grid: {
      left: 60,
      right: 20,
      bottom: 60,
      top: 60
    },
    dataZoom: [{
      type: 'inside',
      start: 0,
      end: 100
    }]
  }
})

function formatNumber(value) {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value)
}

function formatCurrency(value) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency.value,
    minimumFractionDigits: 2,
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

function formatDateLong(timestamp) {
  return new Date(timestamp).toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function confirmDeleteReading(reading) {
  if (confirm('Ablesung wirklich löschen?')) {
    dataStore.deleteReading(reading.id)
  }
}

function handleReadingAdded() {
  showAddReading.value = false
}

function handleMeterUpdated() {
  showEditMeter.value = false
}
</script>