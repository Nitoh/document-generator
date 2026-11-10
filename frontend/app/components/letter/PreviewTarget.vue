<script setup lang="ts">
defineProps<{ as?: string; enabled?: boolean; label: string }>()
const emit = defineEmits<{ select: [] }>()
function activate(event: Event, enabled?: boolean) {
  if (!enabled) return
  if (event.target instanceof Element && event.target.closest('.drag-image img')) return
  event.preventDefault()
  emit('select')
}
</script>
<template>
  <component :is="as ?? 'div'" :class="{ 'preview-target': enabled }"
    :role="enabled ? 'button' : undefined" :tabindex="enabled ? 0 : undefined"
    :aria-label="enabled ? `${label} bearbeiten` : undefined"
    @click="activate($event, enabled)" @keydown.enter="activate($event, enabled)" @keydown.space="activate($event, enabled)">
    <slot />
  </component>
</template>
