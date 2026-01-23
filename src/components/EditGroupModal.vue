<template>
  <div class="fixed inset-0 z-50 overflow-y-auto" @click.self="$emit('close')">
    <div class="flex min-h-screen items-center justify-center p-4">
      <div class="fixed inset-0 bg-black bg-opacity-30 transition-opacity"></div>

      <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <!-- Header -->
        <div class="mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Edit Group</h3>
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

            <!-- Description -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (optional)
              </label>
              <input
                v-model="form.description"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
            </div>

            <!-- Icon -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Icon (Emoji)
              </label>
              <div class="flex space-x-2">
                <input
                  v-model="form.icon"
                  type="text"
                  maxlength="2"
                  class="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-center text-2xl"
                >
                <div class="flex-1 text-sm text-gray-600 dark:text-gray-400 flex items-center">
                  Choose an icon for this group
                </div>
              </div>

              <!-- Common Icons -->
              <div class="mt-2 flex flex-wrap gap-2">
                <button
                  v-for="emoji in commonIcons"
                  :key="emoji"
                  type="button"
                  @click="form.icon = emoji"
                  class="text-2xl p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  :class="{ 'bg-primary-100 dark:bg-primary-900/30': form.icon === emoji }"
                >
                  {{ emoji }}
                </button>
              </div>
            </div>

            <!-- Color -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color
              </label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="color in colors"
                  :key="color.value"
                  type="button"
                  @click="form.color = color.value"
                  class="w-8 h-8 rounded-full border-2 transition-all"
                  :style="{ backgroundColor: color.value }"
                  :class="form.color === color.value ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'"
                  :title="color.name"
                >
                </button>
              </div>
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
import { ref, onMounted } from 'vue'
import { useDataStore } from '@/stores/dataStore'

const props = defineProps({
  group: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'updated'])

const dataStore = useDataStore()

const commonIcons = ['🏠', '🏢', '🏡', '🏘️', '🏭', '🏬', '🏛️', '⬛', '📍', '🗂️']

const colors = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Gray', value: '#6b7280' },
  { name: 'Indigo', value: '#6366f1' }
]

const form = ref({
  name: '',
  description: '',
  icon: '🏠',
  color: '#3b82f6'
})

onMounted(() => {
  form.value = {
    name: props.group.name,
    description: props.group.description || '',
    icon: props.group.icon || '🏠',
    color: props.group.color || '#3b82f6'
  }
})

function handleSubmit() {
  try {
    dataStore.updateGroup(props.group.id, {
      name: form.value.name,
      description: form.value.description,
      icon: form.value.icon,
      color: form.value.color
    })
    emit('updated')
  } catch (error) {
    alert('Error saving group: ' + error.message)
  }
}
</script>
