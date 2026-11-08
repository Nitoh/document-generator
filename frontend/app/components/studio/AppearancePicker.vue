<script setup lang="ts">
import type { HeaderStyle, LetterDesign } from '~/types/document'
import { designs, headerStyles } from '~/data/template-presets'
const design = defineModel<LetterDesign>('design', { required: true })
const header = defineModel<HeaderStyle>('header', { required: true })
const props = withDefaults(defineProps<{ idPrefix?: string }>(), { idPrefix: 'appearance' })
</script>
<template>
  <fieldset class="appearance-picker"><legend>Brieflayout</legend><div class="layout-options">
    <label v-for="item in designs" :key="item.id" class="layout-option" :class="{ selected: design === item.id }">
      <input v-model="design" type="radio" :name="`${props.idPrefix}-layout`" :value="item.id"><span class="layout-mini" :data-design="item.id" aria-hidden="true"><i /><b /><span /><span /><span /></span><strong>{{ item.label }}</strong><small>{{ item.description }}</small>
    </label>
  </div><div class="form-field"><label :for="`${props.idPrefix}-header`">Briefkopf</label><select :id="`${props.idPrefix}-header`" v-model="header"><option v-for="item in headerStyles" :key="item.id" :value="item.id">{{ item.label }}</option></select></div><p class="field-hint">Jedes Layout passt zu jeder Vorlage. Du kannst beide Auswahlen später ändern.</p></fieldset>
</template>
