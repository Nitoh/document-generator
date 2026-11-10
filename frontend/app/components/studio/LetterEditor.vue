<script setup lang="ts">
import { focusEditorField, type PreviewBlock } from '~/utils/editor-links'
import { salutations, closings, closingTexts, headerStyles } from '~/data/template-presets'
import type { LetterDraft, LetterSection, TextBlockFormat } from '~/types/document'
const draft = defineModel<LetterDraft>('draft', { required: true })
const values = defineModel<Record<string, string>>('values', { required: true })
defineProps<{ fields: string[]; busy: boolean }>()
defineEmits<{ generate: [] }>()
const tab = ref('sender')
const tabs = [{ id: 'sender', title: 'Absender', number: '01' }, { id: 'recipient', title: 'Empfänger', number: '02' }, { id: 'content', title: 'Inhalt', number: '03' }, { id: 'details', title: 'Details', number: '04' }]
function moveTab(event: KeyboardEvent, index: number) {
  const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : -1
  if (next < 0) return
  event.preventDefault(); tab.value = tabs[next]!.id
  document.getElementById(`tab-${tab.value}`)?.focus()
}
async function focusBlock(block: PreviewBlock) {
  const targets: Partial<Record<PreviewBlock, [string, string]>> = {
    header: ['sender', 'sender-name'], recipient: ['recipient', 'recipient-name'], information: ['details', 'reference'],
    subject: ['content', 'subject'], salutation: ['recipient', 'salutation'], closingText: ['details', 'closing-text'],
    closing: ['details', 'closing'], signature: ['details', 'signature'], footer: ['details', 'footer']
  }
  const target = block.startsWith('body:') ? ['content', 'body'] as const : targets[block]
  if (!target) return
  tab.value = target[0]
  await nextTick()
  const field = focusEditorField(target[1])
  if (field instanceof HTMLTextAreaElement && block.startsWith('body:')) {
    const breaks = [...field.value.matchAll(/\r?\n[ \t]*\r?\n/g)]
    const index = Number(block.slice(5))
    const before = breaks[index - 1]
    field.setSelectionRange(before ? before.index + before[0].length : 0, breaks[index]?.index ?? field.value.length)
  }
}
function setFormat(section: LetterSection, value?: TextBlockFormat | null) {
  const formats = { ...draft.value.layout.sectionFormats }
  if (value) formats[section] = value
  else delete formats[section]
  draft.value.layout.sectionFormats = formats
}
defineExpose({ focusBlock })
</script>
<template>
  <section class="editor-panel no-print" aria-label="Brief bearbeiten">
    <div class="editor-heading"><div><span class="eyebrow">DEIN ENTWURF</span><h2>Brief ausfüllen</h2></div><span class="edit-symbol" aria-hidden="true">↗</span></div>
    <div class="editor-tabs" role="tablist" aria-label="Briefabschnitte">
      <button v-for="(item,index) in tabs" :id="`tab-${item.id}`" :key="item.id" role="tab" :aria-selected="tab === item.id" :aria-controls="`panel-${item.id}`" :tabindex="tab === item.id ? 0 : -1" @click="tab = item.id" @keydown="moveTab($event,index)"><span>{{ item.number }}</span>{{ item.title }}</button>
    </div>
    <div :id="`panel-${tab}`" class="editor-content" role="tabpanel" :aria-labelledby="`tab-${tab}`">
      <template v-if="tab === 'sender'">
        <div class="section-caption"><span>ABSENDER & BRIEFKOPF</span><span>01 / 04</span></div>
        <StudioLetterBlockOptions :layout="draft.layout" kind="header" />
        <label class="form-field">Briefkopf-Layout
          <select v-model="draft.layout.headerStyle"><option v-for="item in headerStyles" :key="item.id" :value="item.id">{{ item.label }}</option></select>
        </label>
        <UiFormField id="sender-name" v-model="draft.layout.senderName" label="Name oder Unternehmen" :maxlength="120" />
        <UiFormField id="sender-street" v-model="draft.layout.senderStreet" label="Straße und Hausnummer" :maxlength="120" />
        <div class="field-row postal"><UiFormField id="sender-postal" v-model="draft.layout.senderPostalCode" label="Postleitzahl" :maxlength="20" /><UiFormField id="sender-city" v-model="draft.layout.senderCity" label="Ort" :maxlength="80" /></div>
        <div class="field-row"><UiFormField id="sender-email" v-model="draft.layout.senderEmail" label="E-Mail (optional)" type="email" :maxlength="120" /><UiFormField id="sender-phone" v-model="draft.layout.senderPhone" label="Telefon (optional)" type="tel" :maxlength="50" /></div>
        <label class="toggle-row"><span><strong>Nitoh-Logo im Briefkopf</strong><small>Wird verwendet, wenn kein eigenes Logo eingesetzt ist.</small></span><input v-model="draft.layout.showLogo" type="checkbox" role="switch"></label>
        <StudioImageField v-model="draft.layout.logoImage" role="logo" label="Eigenes Logo" />
        <button class="button next-button" @click="tab = 'recipient'">Weiter zum Empfänger <span>→</span></button>
      </template>
      <template v-else-if="tab === 'recipient'">
        <div class="section-caption"><span>ANSCHRIFT & ANREDE</span><span>02 / 04</span></div>
        <UiFormField id="recipient-name" v-model="draft.layout.recipientName" label="Empfänger / Unternehmen" :maxlength="160" />
        <UiFormField id="recipient-street" v-model="draft.layout.recipientStreet" label="Straße und Hausnummer" :maxlength="120" />
        <div class="field-row postal"><UiFormField id="recipient-postal" v-model="draft.layout.recipientPostalCode" label="Postleitzahl" :maxlength="20" /><UiFormField id="recipient-city" v-model="draft.layout.recipientCity" label="Ort" :maxlength="80" /></div>
        <div class="form-field"><label for="salutation-preset">Anrede-Baustein wählen</label><select id="salutation-preset" :value="draft.layout.salutation" @change="draft.layout.salutation = ($event.target as HTMLSelectElement).value"><option :value="draft.layout.salutation">Eigene / aktuelle Anrede</option><option v-for="item in salutations" :key="item.id" :value="item.text">{{ item.label }}</option></select></div>
        <StudioTextFormatField label="Anrede" protected-block :model-value="draft.layout.sectionFormats?.salutation" @update:model-value="setFormat('salutation', $event)" />
        <UiFormField id="salutation" v-model="draft.layout.salutation" label="Anrede" :maxlength="160" hint="Zum Beispiel: Sehr geehrte Frau Musterfrau," />
        <div class="editor-tip"><span>↳</span> Die Anschrift wird automatisch im Fensterbereich des Briefes platziert.</div>
        <button class="button next-button" @click="tab = 'content'">Weiter zum Brieftext <span>→</span></button>
      </template>
      <template v-else-if="tab === 'content'">
        <div class="section-caption"><span>BETREFF & BRIEFTEXT</span><span>03 / 04</span></div>
        <StudioTextFormatField label="Betreff" protected-block bold :model-value="draft.layout.sectionFormats?.subject" @update:model-value="setFormat('subject', $event)" />
        <UiFormField id="subject" v-model="draft.layout.subject" label="Betreff" :maxlength="180" />
        <UiFormField id="body" v-model="draft.content" label="Dein Brieftext" multiline :rows="10" :maxlength="20000" hint="Wiederkehrende Angaben kannst du als {{Platzhalter}} schreiben." />
        <div v-if="fields.length" class="placeholder-fields"><span class="section-caption">PLATZHALTER AUSFÜLLEN</span><UiFormField v-for="(field,index) in fields" :id="`value-${index}`" :key="field" :model-value="values[field] || ''" :label="field" :maxlength="5000" @update:model-value="values[field] = $event" /></div>
        <button class="button next-button" @click="tab = 'details'">Weiter zu den Details <span>→</span></button>
      </template>
      <template v-else>
        <div class="section-caption"><span>ABSCHLUSS & FORMAT</span><span>04 / 04</span></div>
        <fieldset class="preview-editor-group">
        <legend>Informationsblock</legend>
        <StudioLetterBlockOptions :layout="draft.layout" kind="information" />
        <div class="field-row"><UiFormField id="letter-city" v-model="draft.layout.city" label="Ausstellungsort" :maxlength="80" /><UiFormField id="letter-date" v-model="draft.layout.date" label="Datum" type="date" :maxlength="10" /></div>
        <UiFormField id="reference" v-model="draft.layout.reference" label="Aktenzeichen / Referenz (optional)" :maxlength="60" />
        <div class="field-row"><UiFormField id="info-email" v-model="draft.layout.senderEmail" label="E-Mail (optional)" type="email" :maxlength="120" /><UiFormField id="info-phone" v-model="draft.layout.senderPhone" label="Telefon (optional)" type="tel" :maxlength="50" /></div>
        </fieldset>
        <StudioTextFormatField label="Abschlussabsatz" protected-block :model-value="draft.layout.sectionFormats?.closingText" @update:model-value="setFormat('closingText', $event)" />
        <div class="form-field"><label for="closing-text-preset">Abschlusstext wählen</label><select id="closing-text-preset" :value="draft.layout.closingText" @change="draft.layout.closingText = ($event.target as HTMLSelectElement).value"><option :value="draft.layout.closingText">Eigener / aktueller Text</option><option v-for="item in closingTexts" :key="item.id" :value="item.text">{{ item.label }}</option></select></div><UiFormField id="closing-text" v-model="draft.layout.closingText" label="Abschlussabsatz (optional)" multiline :rows="2" :maxlength="600" />
        <div class="form-field"><label for="closing-preset">Abschluss-Baustein wählen</label><select id="closing-preset" :value="draft.layout.closing" @change="draft.layout.closing = ($event.target as HTMLSelectElement).value"><option :value="draft.layout.closing">Eigener / aktueller Abschluss</option><option v-for="item in closings" :key="item.id" :value="item.text">{{ item.label }}</option></select></div>
        <StudioTextFormatField label="Grußformel" protected-block :model-value="draft.layout.sectionFormats?.closing" @update:model-value="setFormat('closing', $event)" />
        <UiFormField id="closing" v-model="draft.layout.closing" label="Grußformel" :maxlength="100" />
        <StudioTextFormatField label="Unterschrift" protected-block :model-value="draft.layout.sectionFormats?.signature" @update:model-value="setFormat('signature', $event)" />
        <UiFormField id="signature" v-model="draft.layout.signature" label="Name unter der Unterschrift" :maxlength="120" />
        <StudioImageField v-model="draft.layout.signatureImage" role="signature" label="Unterschrift" />
        <UiFormField id="footer" v-model="draft.layout.footer" label="Fußzeile (optional)" :maxlength="200" hint="Zum Beispiel Firmen- oder Registerangaben." />
        <label class="toggle-row"><span><strong>Falz- und Lochmarken</strong><small>Für Faltung und Ablage.</small></span><input v-model="draft.layout.showFoldMarks" type="checkbox" role="switch"></label>
      </template>
    </div>
    <div class="editor-bottom"><span><span class="status-dot" /> A4 · Hochformat</span><button class="button dark" :disabled="busy" @click="$emit('generate')">{{ busy ? 'Bitte warten …' : 'Brief fertigstellen' }} <span aria-hidden="true">↗</span></button></div>
  </section>
</template>
