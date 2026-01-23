<template>
  <div class="fixed inset-0 z-50 overflow-y-auto" @click.self="$emit('close')">
    <div class="flex min-h-screen items-center justify-center p-4">
      <div class="fixed inset-0 bg-black bg-opacity-30 transition-opacity"></div>

      <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <!-- Header -->
        <div class="mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Zähler hinzufügen</h3>
        </div>

        <!-- No Types Warning -->
        <div v-if="meterTypes.length === 0" class="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p class="text-sm text-yellow-800 dark:text-yellow-300">
            Du musst zuerst einen Zählertyp in den Einstellungen anlegen.
          </p>
          <router-link
            to="/settings"
            class="text-sm text-yellow-900 dark:text-yellow-200 font-medium hover:underline"
          >
            Zu den Einstellungen →
          </router-link>
        </div>

        <!-- Form -->
        <form v-else @submit.prevent="handleSubmit">
          <div class="space-y-4">
            <!-- Meter Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Typ *
              </label>
              <select
                v-model="form.typeId"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Bitte wählen...</option>
                <option v-for="type in meterTypes" :key="type.id" :value="type.id">
                  {{ type.icon }} {{ type.name }} ({{ type.unit }})
                </option>
              </select>
            </div>

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
                placeholder="z.B. Hauptzähler Erdgeschoss"
              >
            </div>

            <!-- Meter Number -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Zählernummer (optional)
              </label>
              <input
                v-model="form.meterNumber"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="z.B. 12345678"
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
                placeholder="z.B. Keller"
              >
            </div>

            <!-- Group -->
            <GroupSelector v-model="form.groupId" />

            <!-- Tariff -->
            <TariffSelector
              v-if="form.typeId"
              v-model="form.tariffId"
              :meter-type-id="form.typeId"
            />

            <!-- Continuous Meter Checkbox -->
            <div class="flex items-start space-x-3">
              <input
                v-model="form.isContinuous"
                type="checkbox"
                id="isContinuous"
                class="mt-1 w-4 h-4 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
              >
              <label for="isContinuous" class="text-sm text-gray-700 dark:text-gray-300">
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
              Hinzufügen
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
import GroupSelector from '@/components/GroupSelector.vue'
import TariffSelector from '@/components/TariffSelector.vue'

const emit = defineEmits(['close', 'added'])

const dataStore = useDataStore()

const meterTypes = computed(() => dataStore.meterTypes)

const form = ref({
  name: '',
  typeId: '',
  meterNumber: '',
  location: '',
  isContinuous: false,
  groupId: null,
  tariffId: null
})

function handleSubmit() {
  try {
    dataStore.addMeter(
      form.value.name,
      form.value.typeId,
      form.value.meterNumber,
      form.value.location,
      form.value.isContinuous,
      form.value.groupId,
      form.value.tariffId
    )

    emit('added')
  } catch (error) {
    alert('Fehler beim Hinzufugen: ' + error.message)
  }
}
</script>