<script setup lang="ts">
import { focusEditorField, type PreviewBlock } from '~/utils/editor-links'
import { splitBlocks } from '~/utils/letter-format'
import { salutations, closings, closingTexts } from '~/data/template-presets'
import type { LetterAttachment, LetterDraft, LetterSection, TextBlockFormat } from '~/types/document'
const draft = defineModel<LetterDraft>({ required: true })
const props = defineProps<{ library: LetterAttachment[]; categories: string[] }>()
const blocks = ref(splitBlocks(draft.value.content).map((text, index) => ({
  id: index, text, format: draft.value.layout.bodyFormats?.[index] ?? null as TextBlockFormat | null
})))
function setSectionFormat(section: LetterSection, format?: TextBlockFormat | null) {
  const formats = { ...draft.value.layout.sectionFormats }
  if (format) formats[section] = format
  else delete formats[section]
  draft.value.layout.sectionFormats = formats
}
let nextId = blocks.value.length
const available = computed(() => [...props.library, ...(draft.value.layout.attachments ?? [])]
  .filter((item, index, all) => all.findIndex(other => other.id === item.id) === index))
const selected = computed({
  get: () => (draft.value.layout.attachments ?? []).map(item => item.id),
  set: (ids: string[]) => {
    draft.value.layout.attachments = ids.map(id => draft.value.layout.attachments?.find(item => item.id === id) ?? available.value.find(item => item.id === id)!)
  }
})
watch(blocks, () => {
  const content = blocks.value.filter(block => block.text.trim())
  draft.value.content = content.map(block => block.text).join('\n\n')
  draft.value.layout.bodyFormats = content.map(block => block.format)
}, { deep: true })
const preset = ref('Rückfrage')
const snippets: Record<string, string> = {
  Rückfrage: 'Bei Fragen stehe ich Ihnen gerne zur Verfügung.',
  Rückmeldung: 'Bitte geben Sie mir bis zum {{Rückmeldefrist}} eine Rückmeldung.',
  Bezug: 'Ich beziehe mich auf {{Vorgang}} vom {{Datum}}.',
  'Eigener Baustein': ''
}
function addBlock() { blocks.value.push({ id: nextId++, text: snippets[preset.value] ?? '', format: null }) }
function move(index: number, direction: number) {
  const item = blocks.value.splice(index, 1)[0]!
  blocks.value.splice(index + direction, 0, item)
}
function focusBlock(block: PreviewBlock) {
  const targets: Partial<Record<PreviewBlock, string>> = {
    header: 'design-sender', recipient: 'design-recipient', information: 'design-reference', subject: 'default-subject',
    salutation: 'default-salutation', closingText: 'default-closing-text', closing: 'default-closing',
    signature: 'default-signature', footer: 'design-footer'
  }
  const match = block.startsWith('body:') ? blocks.value.filter(item => item.text.trim())[Number(block.slice(5))] : undefined
  const id = match ? `block-${match.id}` : targets[block]
  if (id) focusEditorField(id)
}
defineExpose({ focusBlock })
</script>
<template>
  <section class="editor-panel no-print design-fields" aria-label="Briefvorlage gestalten">
    <UiFormField id="template-name" v-model="draft.name" label="Vorlagenname" :maxlength="200" />
    <StudioCategoryField id="template-category" v-model="draft.category" :categories="categories" />
    <fieldset class="preview-editor-group">
      <legend>Briefkopf</legend>
      <StudioLetterBlockOptions :layout="draft.layout" kind="header" />
      <UiFormField id="design-sender" v-model="draft.layout.senderName" label="Absender / Unternehmen" :maxlength="120" />
      <UiFormField id="design-sender-street" v-model="draft.layout.senderStreet" label="Straße und Hausnummer" :maxlength="120" />
      <div class="field-row"><UiFormField id="design-sender-postal" v-model="draft.layout.senderPostalCode" label="Postleitzahl" :maxlength="20" /><UiFormField id="design-sender-city" v-model="draft.layout.senderCity" label="Ort" :maxlength="80" /></div>
      <StudioAppearancePicker v-model:design="draft.layout.design" v-model:header="draft.layout.headerStyle" id-prefix="designer" />
      <StudioImageField v-model="draft.layout.logoImage" role="logo" label="Logo im Briefkopf" />
    </fieldset>
    <fieldset class="preview-editor-group">
      <legend>Empfängeranschrift</legend>
      <UiFormField id="design-recipient" v-model="draft.layout.recipientName" label="Empfänger / Unternehmen" :maxlength="160" />
      <UiFormField id="design-recipient-street" v-model="draft.layout.recipientStreet" label="Straße und Hausnummer" :maxlength="120" />
      <div class="field-row"><UiFormField id="design-recipient-postal" v-model="draft.layout.recipientPostalCode" label="Postleitzahl" :maxlength="20" /><UiFormField id="design-recipient-city" v-model="draft.layout.recipientCity" label="Ort" :maxlength="80" /></div>
    </fieldset>
    <fieldset class="preview-editor-group">
      <legend>Informationsblock</legend>
      <StudioLetterBlockOptions :layout="draft.layout" kind="information" />
      <UiFormField id="design-reference" v-model="draft.layout.reference" label="Aktenzeichen / Referenz" :maxlength="60" />
      <div class="field-row"><UiFormField id="design-phone" v-model="draft.layout.senderPhone" label="Telefon" :maxlength="50" /><UiFormField id="design-email" v-model="draft.layout.senderEmail" label="E-Mail" :maxlength="120" /></div>
      <div class="field-row"><UiFormField id="design-place" v-model="draft.layout.city" label="Ausstellungsort" :maxlength="80" /><UiFormField id="design-date" v-model="draft.layout.date" label="Datum" type="date" :maxlength="10" /></div>
    </fieldset>
    <StudioTextFormatField label="Betreff" protected-block bold :model-value="draft.layout.sectionFormats?.subject" @update:model-value="setSectionFormat('subject', $event)" />
    <UiFormField id="default-subject" v-model="draft.layout.subject" label="Betreff" :maxlength="180" />
    <label class="form-field">Anrede-Voreinstellung
      <select :value="salutations.some(item => item.text === draft.layout.salutation) ? draft.layout.salutation : ''" @change="draft.layout.salutation = ($event.target as HTMLSelectElement).value">
        <option value="">Eigene Anrede</option><option v-for="item in salutations" :key="item.id" :value="item.text">{{ item.label }}</option>
      </select>
    </label>
    <StudioTextFormatField label="Anrede" protected-block :model-value="draft.layout.sectionFormats?.salutation" @update:model-value="setSectionFormat('salutation', $event)" />
    <UiFormField id="default-salutation" v-model="draft.layout.salutation" label="Anrede" :maxlength="160" />
    <h2>Brieftext</h2>
    <p class="muted">Änderungen erscheinen sofort in der Vorschau. Verwende Platzhalter wie <code v-text="'{{Name}}'" /> für Angaben pro Brief.</p>
    <div class="archive-tools"><div class="form-field"><label for="snippet">Textbaustein</label><select id="snippet" v-model="preset"><option v-for="(_, name) in snippets" :key="name">{{ name }}</option></select></div><button class="button subtle" @click="addBlock">Baustein hinzufügen</button></div>
    <div v-for="(block, index) in blocks" :key="block.id" class="designer-block preview-editor-group">
      <StudioTextFormatField v-model="block.format" :label="`Baustein ${index + 1}`" />
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
    <StudioTextFormatField label="Abschlussabsatz" protected-block :model-value="draft.layout.sectionFormats?.closingText" @update:model-value="setSectionFormat('closingText', $event)" />
    <UiFormField id="default-closing-text" v-model="draft.layout.closingText" label="Abschlussabsatz" multiline :rows="2" :maxlength="600" />
    <label class="form-field">Grußformel wählen
      <select v-model="draft.layout.closing"><option v-for="item in closings" :key="item.id" :value="item.text">{{ item.label }}</option></select>
    </label>
    <StudioTextFormatField label="Grußformel" protected-block :model-value="draft.layout.sectionFormats?.closing" @update:model-value="setSectionFormat('closing', $event)" />
    <UiFormField id="default-closing" v-model="draft.layout.closing" label="Grußformel" :maxlength="100" />
    <StudioTextFormatField label="Unterschrift" protected-block :model-value="draft.layout.sectionFormats?.signature" @update:model-value="setSectionFormat('signature', $event)" />
    <UiFormField id="default-signature" v-model="draft.layout.signature" label="Name unter der Unterschrift" :maxlength="120" />
    <UiFormField id="design-footer" v-model="draft.layout.footer" label="Fußzeile" :maxlength="200" />
    <StudioImageField v-model="draft.layout.signatureImage" role="signature" label="Unterschrift" />
  </section>
</template>
