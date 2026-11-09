<script setup lang="ts">
defineProps<{ label: string }>()
defineEmits<{ add: [] }>()
</script>
<template>
  <span class="add-item">
    <button type="button" :aria-label="label" @click="$emit('add')"><span aria-hidden="true">＋</span></button>
    <span class="add-hint" aria-hidden="true">{{ label }}</span>
  </span>
</template>
