<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
    :class="sizeClass"
  >
    <div v-if="showHeader" class="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
      <h3 class="font-semibold text-gray-900 dark:text-white">{{ title }}</h3>
      <div class="flex items-center space-x-2">
        <button
          v-if="showRemove"
          @click="$emit('remove')"
          class="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          title="Entfernen"
        >
          ✕
        </button>
      </div>
    </div>
    <div class="p-4">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'medium',
    validator: (v) => ['small', 'medium', 'large'].includes(v)
  },
  showHeader: {
    type: Boolean,
    default: true
  },
  showRemove: {
    type: Boolean,
    default: true
  }
})

defineEmits(['remove'])

const sizeClass = computed(() => {
  return {
    small: 'col-span-1',
    medium: 'col-span-1 md:col-span-2',
    large: 'col-span-1 md:col-span-3'
  }[props.size]
})
</script>
