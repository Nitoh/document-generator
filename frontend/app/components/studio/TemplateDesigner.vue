<script setup lang="ts">
import { salutations, closings, closingTexts } from '~/data/template-presets'
import type { LetterAttachment, LetterDraft } from '~/types/document'
const draft = defineModel<LetterDraft>({ required: true })
const props = defineProps<{ library: LetterAttachment[] }>()
const blocks = ref(draft.value.content.split(/\r?\n[ \t]*\r?\n/).map((text, index) => ({ id: index, text })))
let nextId = blocks.value.length
const available = computed(() => [...props.library, ...(draft.value.layout.attachments ?? [])]
  .filter((item, index, all) => all.findIndex(other => other.id === item.id) === index))
const selected = computed({
  get: () => (draft.value.layout.attachments ?? []).map(item => item.id),
  set: (ids: string[]) => {
    draft.value.layout.attachments = ids.map(id => draft.value.layout.attachments?.find(item => item.id === id) ?? available.value.find(item => item.id === id)!)
  }
})
watch(blocks, () => { draft.value.content = blocks.value.map(block => block.text).filter(text => text.trim()).join('\n\n') }, { deep: true, flush: 'sync' })
const preset = ref('Rückfrage')
const snippets: Record<string, string> = {
  Rückfrage: 'Bei Fragen stehe ich Ihnen gerne zur Verfügung.',
  Rückmeldung: 'Bitte geben Sie mir bis zum {{Rückmeldefrist}} eine Rückmeldung.',
  Bezug: 'Ich beziehe mich auf {{Vorgang}} vom {{Datum}}.',
  'Eigener Baustein': ''
}
function addBlock() { blocks.value.push({ id: nextId++, text: snippets[preset.value] ?? '' }) }
function move(index: number, direction: number) {
  const item = blocks.value.splice(index, 1)[0]!
  blocks.value.splice(index + direction, 0, item)
}
</script>
<template>
  <section class="editor-panel no-print design-fields" aria-label="Briefvorlage gestalten">
    <UiFormField id="template-name" v-model="draft.name" label="Vorlagenname" :maxlength="200" />
    <UiFormField id="template-category" v-model="draft.category" label="Kategorie" :maxlength="80" />
    <StudioAppearancePicker v-model:design="draft.layout.design" v-model:header="draft.layout.headerStyle" id-prefix="designer" />
    <UiFormField id="default-subject" v-model="draft.layout.subject" label="Betreff" :maxlength="180" />
    <label class="form-field">Anrede-Voreinstellung
      <select :value="salutations.some(item => item.text === draft.layout.salutation) ? draft.layout.salutation : ''" @change="draft.layout.salutation = ($event.target as HTMLSelectElement).value">
        <option value="">Eigene Anrede</option><option v-for="item in salutations" :key="item.id" :value="item.text">{{ item.label }}</option>
      </select>
    </label>
    <UiFormField id="default-salutation" v-model="draft.layout.salutation" label="Anrede" :maxlength="160" />
    <h2>Brieftext</h2>
    <p class="muted">Änderungen erscheinen sofort in der Vorschau. Verwende Platzhalter wie <code v-text="'{{Name}}'" /> für Angaben pro Brief.</p>
    <div class="archive-tools"><div class="form-field"><label for="snippet">Textbaustein</label><select id="snippet" v-model="preset"><option v-for="(_, name) in snippets" :key="name">{{ name }}</option></select></div><button class="button subtle" @click="addBlock">Baustein hinzufügen</button></div>
    <div v-for="(block, index) in blocks" :key="block.id" class="designer-block">
      <UiFormField :id="`block-${block.id}`" v-model="block.text" :label="`Baustein ${index + 1}`" multiline :rows="3" :maxlength="20000" />
      <div class="document-actions">
        <button class="button subtle" :disabled="index === 0" :aria-label="`Baustein ${index + 1} nach oben`" @click="move(index, -1)">↑</button>
        <button class="button subtle" :disabled="index === blocks.length - 1" :aria-label="`Baustein ${index + 1} nach unten`" @click="move(index, 1)">↓</button>
        <button class="button subtle" @click="blocks.splice(index, 1)">Entfernen</button>
      </div>
    </div>
    <fieldset class="appearance-picker">
      <legend>Feste Anlagen dieser Vorlage</legend>
      <p v-if="!available.length" class="muted">Lege in der Library unter „Formulare“ eine Anlage an.</p>
      <label v-for="item in available" :key="item.id" class="attachment-option"><input v-model="selected" type="checkbox" :value="item.id" :disabled="selected.length >= 5 && !selected.includes(item.id)"> {{ item.title }} <button v-if="selected.includes(item.id) && library.find(form => form.id === item.id) && JSON.stringify(draft.layout.attachments?.find(form => form.id === item.id)) !== JSON.stringify(library.find(form => form.id === item.id))" type="button" class="button subtle" @click.prevent="draft.layout.attachments = draft.layout.attachments?.map(form => form.id === item.id ? item : form)">Aktuelle Formularversion übernehmen</button></label>
    </fieldset>
    <label class="form-field">Abschlussabsatz wählen
      <select v-model="draft.layout.closingText"><option v-for="item in closingTexts" :key="item.id" :value="item.text">{{ item.label }}</option></select>
    </label>
    <UiFormField id="default-closing-text" v-model="draft.layout.closingText" label="Abschlussabsatz" multiline :rows="2" :maxlength="600" />
    <label class="form-field">Grußformel wählen
      <select v-model="draft.layout.closing"><option v-for="item in closings" :key="item.id" :value="item.text">{{ item.label }}</option></select>
    </label>
    <UiFormField id="default-closing" v-model="draft.layout.closing" label="Grußformel" :maxlength="100" />
    <UiFormField id="default-signature" v-model="draft.layout.signature" label="Name unter der Unterschrift" :maxlength="120" />
    <StudioImageField v-model="draft.layout.logoImage" label="Logo im Briefkopf" />
    <StudioImageField v-model="draft.layout.signatureImage" label="Unterschrift" />
  </section>
</template>
