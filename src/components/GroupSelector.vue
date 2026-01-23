<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      Group (optional)
    </label>
    <select
      :value="modelValue"
      @change="$emit('update:modelValue', $event.target.value || null)"
      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
    >
      <option value="">No group</option>
      <option v-for="group in groups" :key="group.id" :value="group.id">
        {{ group.icon }} {{ group.name }}
      </option>
    </select>
    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
      Organize meters by location or property
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDataStore } from '@/stores/dataStore'

defineProps({
  modelValue: {
    type: String,
    default: null
  }
})

defineEmits(['update:modelValue'])

const dataStore = useDataStore()
const groups = computed(() => dataStore.groups)
</script>
