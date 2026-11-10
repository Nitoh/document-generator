<script setup lang="ts">
import type { LetterDraft } from '~/types/document'
import { buildTemplate, closings, closingTexts, salutations, textPresets, type BuilderChoices } from '~/data/template-presets'
const props = defineProps<{ categories: string[] }>()
const emit = defineEmits<{ close: []; create: [draft: LetterDraft] }>()
const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const choices = reactive<BuilderChoices>({ preset: 'blank', name: 'Eigene Briefvorlage', category: 'Allgemeines', design: 'classic', headerStyle: 'standard', salutation: salutations[0]!.text, closing: closings[0]!.text, closingText: '' })
const error = ref('')
const preview = computed(() => buildTemplate(choices))
watch(() => choices.preset, id => {
  const preset = textPresets.find(item => item.id === id)!
  choices.name = preset.name; choices.category = preset.category
})
onMounted(() => dialog.value?.showModal())
function create() {
  if (!choices.name.trim() || !choices.category.trim()) { error.value = 'Bitte gib einen Namen und eine Kategorie an.'; return }
  emit('create', buildTemplate(choices))
}
</script>
<template>
  <dialog ref="dialog" class="library-dialog builder-dialog template-builder no-print" aria-labelledby="builder-title" @close="emit('close')">
    <div class="dialog-heading"><div><span class="eyebrow">DEIN VORLAGENBAUKASTEN</span><h2 id="builder-title">Neue Briefvorlage.</h2></div><button class="icon-button" aria-label="Vorlagenbaukasten schließen" @click="emit('close')">×</button></div>
    <p class="muted">Kombiniere Inhalt, Briefkopf und Gestaltung. Alles bleibt später bearbeitbar.</p>
    <div class="builder-workspace">
    <form @submit.prevent="create">
      <div class="form-field"><label for="builder-preset">Text als Ausgangspunkt</label><select id="builder-preset" v-model="choices.preset"><option v-for="item in textPresets" :key="item.id" :value="item.id">{{ item.name }}</option></select></div>
      <UiFormField id="builder-name" v-model="choices.name" label="Name der Briefvorlage" :maxlength="200" />
      <StudioCategoryField id="builder-category" :key="choices.preset" v-model="choices.category" :categories="props.categories" />
      <StudioAppearancePicker v-model:design="choices.design" v-model:header="choices.headerStyle" id-prefix="builder" />
      <div class="field-row"><div class="form-field"><label for="builder-salutation">Anrede-Baustein</label><select id="builder-salutation" v-model="choices.salutation"><option v-for="item in salutations" :key="item.id" :value="item.text">{{ item.label }}</option></select></div><div class="form-field"><label for="builder-closing">Abschluss-Baustein</label><select id="builder-closing" v-model="choices.closing"><option v-for="item in closings" :key="item.id" :value="item.text">{{ item.label }}</option></select></div></div>
      <div class="form-field"><label for="builder-closing-text">Abschlusstext</label><select id="builder-closing-text" v-model="choices.closingText"><option v-for="item in closingTexts" :key="item.id" :value="item.text">{{ item.label }}</option></select></div>
      <p v-if="error" class="studio-feedback error" role="alert">{{ error }}</p>
      <div class="builder-actions"><button class="button subtle" type="button" @click="emit('close')">Abbrechen</button><button class="button dark" type="submit">Vorlage zusammenbauen <span>→</span></button></div>
    </form>
    <LetterPreview :layout="preview.layout" :body="preview.content" :ready="false" />
    </div>
  </dialog>
</template>
