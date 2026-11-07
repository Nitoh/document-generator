<script setup lang="ts">
withDefaults(defineProps<{ label: string; id: string; type?: string; multiline?: boolean; rows?: number; maxlength?: number; hint?: string }>(), { type: 'text', rows: 5, maxlength: 200 })
const model = defineModel<string>({ required: true })
</script>
<template>
  <div class="form-field">
    <label :for="id">{{ label }}</label>
    <textarea v-if="multiline" :id="id" v-model="model" :rows="rows" :maxlength="maxlength" :aria-describedby="hint ? `${id}-hint` : undefined" />
    <input v-else :id="id" v-model="model" :type="type" :maxlength="maxlength" :aria-describedby="hint ? `${id}-hint` : undefined">
    <span v-if="hint" :id="`${id}-hint`" class="field-hint">{{ hint }}</span>
  </div>
</template>
