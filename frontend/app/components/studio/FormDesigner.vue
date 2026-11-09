<script setup lang="ts">
import { createDraft } from '~/utils/letter'
import type { LetterAttachment } from '~/types/document'
const props = defineProps<{ form: LetterAttachment; categories: string[] }>()
const emit = defineEmits<{ save: []; close: [] }>()
const baseLayout = createDraft().layout
const layout = computed(() => ({ ...baseLayout, attachments: [{ ...props.form, title: props.form.title || 'Formulartitel' }] }))
</script>
<template>
  <div class="studio-workspace">
    <section class="editor-panel no-print design-fields" aria-label="Formular gestalten">
      <UiFormField id="form-title" v-model="form.title" label="Titel des Formulars" :maxlength="200" />
      <StudioCategoryField id="form-category" :model-value="form.category || 'Allgemeines'" :categories="categories" @update:model-value="form.category = $event" />
      <UiFormField id="form-content" v-model="form.content" label="Formulartext" multiline :rows="12" :maxlength="20000" />
      <StudioTextFormatField v-model="form.textFormat" label="Formulartext" />
      <button class="button subtle" @click="form.content = (form.content + ' {{Feldname}}').slice(0, 20000)">Platzhalter einfügen</button>
      <StudioImageField v-model="form.image" role="attachment" label="Bild auf der ersten Formularseite" />
      <div class="catalog-actions"><button class="button subtle" @click="emit('close')">Abbrechen</button><button class="button dark" @click="emit('save')">Formular speichern</button></div>
    </section>
    <LetterPreview :layout="layout" body="" :ready="false" attachment-only designer />
  </div>
</template>
