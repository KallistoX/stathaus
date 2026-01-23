<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        Übersicht deiner Zählerstände
      </p>
    </div>

    <!-- Empty State -->
    <div v-if="metersWithTypes.length === 0" class="text-center py-16">
      <div class="text-6xl mb-4">📊</div>
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Noch keine Zähler vorhanden
      </h3>
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        Lege deinen ersten Zähler an, um zu starten
      </p>
      <router-link
        to="/meters"
        class="inline-flex items-center px-6 py-3 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
      >
        <span class="mr-2">⚡</span>
        Zähler anlegen
      </router-link>
    </div>

    <!-- Meters Grid -->
    <div v-else>
      <!-- Grouped Meters -->
      <div v-for="group in groups" :key="group.id" class="mb-8">
        <div
          class="flex items-center justify-between mb-4 cursor-pointer"
          @click="toggleGroup(group.id)"
        >
          <div class="flex items-center space-x-3">
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
              :style="{ backgroundColor: group.color + '20' }"
            >
              {{ group.icon }}
            </div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ group.name }}</h2>
            <span class="text-sm text-gray-500 dark:text-gray-400">
              ({{ getGroupMeters(group.id).length }})
            </span>
          </div>
          <button class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
            {{ collapsedGroups.has(group.id) ? '▶' : '▼' }}
          </button>
        </div>

        <div v-show="!collapsedGroups.has(group.id)" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="meter in getGroupMeters(group.id)"
            :key="meter.id"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
            :style="{ borderLeftColor: group.color, borderLeftWidth: '4px' }"
            @click="$router.push(`/meters/${meter.id}`)"
          >
            <!-- Meter Card Content -->
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center space-x-2">
                <span class="text-2xl">{{ meter.type?.icon || '📊' }}</span>
                <div>
                  <h3 class="font-semibold text-gray-900 dark:text-white">{{ meter.name }}</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ meter.type?.name }}</p>
                  <p v-if="meter.location" class="text-xs text-gray-400 dark:text-gray-500">📍 {{ meter.location }}</p>
                </div>
              </div>
            </div>

            <div v-if="getLatestReading(meter.id)" class="space-y-2">
              <div class="flex items-baseline justify-between">
                <span class="text-3xl font-bold text-gray-900 dark:text-white">
                  {{ formatNumber(getLatestReading(meter.id).value) }}
                </span>
                <span class="text-sm text-gray-500 dark:text-gray-400">{{ meter.type?.unit }}</span>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatDate(getLatestReading(meter.id).timestamp) }}
              </p>
            </div>
            <div v-else class="text-gray-400 dark:text-gray-500 text-sm">
              Keine Ablesung vorhanden
            </div>

            <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                @click.stop="showAddReading(meter)"
                class="w-full text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
              >
                + Ablesung erfassen
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Ungrouped Meters -->
      <div v-if="ungroupedMeters.length > 0" class="mb-8">
        <div
          class="flex items-center justify-between mb-4 cursor-pointer"
          @click="toggleGroup('ungrouped')"
        >
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center text-lg bg-gray-100 dark:bg-gray-700">
              📋
            </div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Ungrouped</h2>
            <span class="text-sm text-gray-500 dark:text-gray-400">
              ({{ ungroupedMeters.length }})
            </span>
          </div>
          <button class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
            {{ collapsedGroups.has('ungrouped') ? '▶' : '▼' }}
          </button>
        </div>

        <div v-show="!collapsedGroups.has('ungrouped')" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="meter in ungroupedMeters"
            :key="meter.id"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
            @click="$router.push(`/meters/${meter.id}`)"
          >
            <!-- Meter Card Content -->
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center space-x-2">
                <span class="text-2xl">{{ meter.type?.icon || '📊' }}</span>
                <div>
                  <h3 class="font-semibold text-gray-900 dark:text-white">{{ meter.name }}</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ meter.type?.name }}</p>
                  <p v-if="meter.location" class="text-xs text-gray-400 dark:text-gray-500">📍 {{ meter.location }}</p>
                </div>
              </div>
            </div>

            <div v-if="getLatestReading(meter.id)" class="space-y-2">
              <div class="flex items-baseline justify-between">
                <span class="text-3xl font-bold text-gray-900 dark:text-white">
                  {{ formatNumber(getLatestReading(meter.id).value) }}
                </span>
                <span class="text-sm text-gray-500 dark:text-gray-400">{{ meter.type?.unit }}</span>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatDate(getLatestReading(meter.id).timestamp) }}
              </p>
            </div>
            <div v-else class="text-gray-400 dark:text-gray-500 text-sm">
              Keine Ablesung vorhanden
            </div>

            <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                @click.stop="showAddReading(meter)"
                class="w-full text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
              >
                + Ablesung erfassen
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Show all meters flat when no groups exist -->
      <div v-if="groups.length === 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div
          v-for="meter in metersWithTypes"
          :key="meter.id"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
          @click="$router.push(`/meters/${meter.id}`)"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center space-x-2">
              <span class="text-2xl">{{ meter.type?.icon || '📊' }}</span>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white">{{ meter.name }}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ meter.type?.name }}</p>
                <p v-if="meter.location" class="text-xs text-gray-400 dark:text-gray-500">📍 {{ meter.location }}</p>
              </div>
            </div>
          </div>

          <div v-if="getLatestReading(meter.id)" class="space-y-2">
            <div class="flex items-baseline justify-between">
              <span class="text-3xl font-bold text-gray-900 dark:text-white">
                {{ formatNumber(getLatestReading(meter.id).value) }}
              </span>
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ meter.type?.unit }}</span>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatDate(getLatestReading(meter.id).timestamp) }}
            </p>
          </div>
          <div v-else class="text-gray-400 dark:text-gray-500 text-sm">
            Keine Ablesung vorhanden
          </div>

          <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              @click.stop="showAddReading(meter)"
              class="w-full text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
            >
              + Ablesung erfassen
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Add Button (Mobile) -->
      <router-link
        to="/meters"
        class="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary-600 dark:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
      >
        +
      </router-link>
    </div>

    <!-- Add Reading Modal -->
    <QuickAddReadingModal
      v-if="selectedMeter"
      :meter="selectedMeter"
      @close="selectedMeter = null"
      @added="handleReadingAdded"
    />
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import QuickAddReadingModal from '@/components/QuickAddReadingModal.vue'

const dataStore = useDataStore()

const metersWithTypes = computed(() => dataStore.metersWithTypes)
const groups = computed(() => dataStore.groups)
const ungroupedMeters = computed(() => dataStore.ungroupedMeters)
const selectedMeter = ref(null)
const collapsedGroups = reactive(new Set())

function getGroupMeters(groupId) {
  return metersWithTypes.value.filter(m => m.groupId === groupId)
}

function toggleGroup(groupId) {
  if (collapsedGroups.has(groupId)) {
    collapsedGroups.delete(groupId)
  } else {
    collapsedGroups.add(groupId)
  }
}

function getLatestReading(meterId) {
  return dataStore.getLatestReading(meterId)
}

function formatNumber(value) {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 0,
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

function showAddReading(meter) {
  selectedMeter.value = meter
}

function handleReadingAdded() {
  selectedMeter.value = null
}
</script>