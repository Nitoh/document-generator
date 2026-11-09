<script setup lang="ts">
import type { TextBlockFormat } from '~/types/document'
import { defaultFormat } from '~/utils/letter-format'
const props = defineProps<{ label: string; protectedBlock?: boolean; bold?: boolean }>()
const model = defineModel<TextBlockFormat | null | undefined>()
const unit = ref('mm')
const factor = computed(() => unit.value === 'mm' ? 1 : 10)
function enable() {
  if (props.protectedBlock && !window.confirm(`„${props.label}“ ist im Standardlayout linksbündig. Eine abweichende Ausrichtung oder Einrückung kann vom Briefstandard abweichen. Formatierung trotzdem freigeben?`)) return
  model.value = defaultFormat(props.bold)
}
</script>
<template>
  <details class="text-format">
    <summary>Formatierung · {{ label }}</summary>
    <button v-if="!model" type="button" class="button subtle" @click="enable">Formatierung bearbeiten</button>
    <template v-else>
      <div class="format-grid">
        <label>Ausrichtung <select v-model="model.align"><option value="left">Linksbündig</option><option value="center">Zentriert</option><option value="right">Rechtsbündig</option></select></label>
        <label>Einheit <select v-model="unit"><option>mm</option><option>cm</option></select></label>
        <label>Einzug ({{ unit }}) <input type="number" min="0" step="0.1" :value="model.indent / factor" @input="model.indent = Math.min(135, Math.max(0, Number(($event.target as HTMLInputElement).value) * factor))"></label>
        <label>Abstand davor ({{ unit }}) <input type="number" min="0" step="0.1" :value="model.before / factor" @input="model.before = Math.min(50, Math.max(0, Number(($event.target as HTMLInputElement).value) * factor))"></label>
        <label>Tabstopps (12,5 mm) <input type="number" min="0" max="10" :value="model.tabs" @input="model.tabs = Math.min(10, Math.max(0, Number(($event.target as HTMLInputElement).value)))"></label>
        <div><label><input v-model="model.bold" type="checkbox"> Fett</label> <label><input v-model="model.italic" type="checkbox"> Kursiv</label></div>
      </div>
      <button class="button subtle" type="button" @click="model = null">Standard wiederherstellen</button>
    </template>
  </details>
</template>
