<script setup lang="ts">
import type { LetterLayout } from '~/types/document'
defineProps<{ layout: LetterLayout; kind: 'header' | 'information' }>()
</script>
<template>
  <template v-if="kind === 'header'">
    <label class="toggle-row">
      <span><strong>Briefkopf anzeigen</strong><small>Die Rücksendezeile im Anschriftfeld bleibt erhalten.</small></span>
      <input type="checkbox" role="switch" :checked="layout.showHeader !== false" @change="layout.showHeader = ($event.target as HTMLInputElement).checked">
    </label>
  </template>
  <template v-else>
    <label class="toggle-row">
      <span><strong>Informationsblock anzeigen</strong><small>Aktenzeichen, Kontaktdaten, Ort und Datum.</small></span>
      <input type="checkbox" role="switch" :checked="layout.showInformation !== false" @change="layout.showInformation = ($event.target as HTMLInputElement).checked">
    </label>
    <label class="form-field">Ausrichtung im Informationsblock
      <select :value="layout.informationAlign ?? 'left'" @change="layout.informationAlign = ($event.target as HTMLSelectElement).value as LetterLayout['informationAlign']">
        <option value="left">Linksbündig</option><option value="center">Zentriert</option><option value="right">Rechtsbündig</option>
      </select>
    </label>
  </template>
</template>
