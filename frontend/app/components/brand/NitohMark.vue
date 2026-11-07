<script setup lang="ts">
defineProps<{ decorative?: boolean }>()
</script>
<template>
  <svg viewBox="0 0 64 64" class="nitoh-mark" :aria-hidden="decorative || undefined" :role="decorative ? undefined : 'img'" :aria-label="decorative ? undefined : 'Nitoh N-Logo'">
    <circle cx="32" cy="32" r="31" fill="#171715" />
    <path d="M18 45V19h7l14 17V19h7v26h-7L25 28v17Z" fill="#d8c7aa" />
  </svg>
</template>
