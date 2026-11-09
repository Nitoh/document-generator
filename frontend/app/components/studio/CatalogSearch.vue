<script setup lang="ts">
defineProps<{ id: string; label: string }>()
const query = defineModel<string>({ required: true })
const input = useTemplateRef<HTMLInputElement>('input')
function clear() {
  query.value = ''
  input.value?.focus()
}
</script>
<template>
  <div class="studio-search" role="search" :aria-label="label">
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="5.5" /><path d="m15 15 4.5 4.5" /></svg>
    <input :id="id" ref="input" v-model="query" type="search" :placeholder="label" :aria-label="label" @keydown.esc="query && clear()">
    <button v-if="query" type="button" aria-label="Suche leeren" title="Suche leeren" @click="clear">×</button>
  </div>
</template>
