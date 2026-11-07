<script setup lang="ts">
import type { LetterDraft } from '~/types/document'
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
</script>
<template>
  <section class="editor-panel no-print" aria-label="Brief bearbeiten">
    <div class="editor-heading"><div><span class="eyebrow">DEIN ENTWURF</span><h2>Die richtigen Details.</h2></div><span class="edit-symbol" aria-hidden="true">↗</span></div>
    <div class="editor-tabs" role="tablist" aria-label="Briefabschnitte">
      <button v-for="(item,index) in tabs" :id="`tab-${item.id}`" :key="item.id" role="tab" :aria-selected="tab === item.id" :aria-controls="`panel-${item.id}`" :tabindex="tab === item.id ? 0 : -1" @click="tab = item.id" @keydown="moveTab($event,index)"><span>{{ item.number }}</span>{{ item.title }}</button>
    </div>
    <div :id="`panel-${tab}`" class="editor-content" role="tabpanel" :aria-labelledby="`tab-${tab}`">
      <template v-if="tab === 'sender'">
        <div class="section-caption"><span>ABSENDER & BRIEFKOPF</span><span>01 / 04</span></div>
        <UiFormField id="sender-name" v-model="draft.layout.senderName" label="Name oder Unternehmen" :maxlength="120" />
        <UiFormField id="sender-street" v-model="draft.layout.senderStreet" label="Straße und Hausnummer" :maxlength="120" />
        <div class="field-row postal"><UiFormField id="sender-postal" v-model="draft.layout.senderPostalCode" label="Postleitzahl" :maxlength="20" /><UiFormField id="sender-city" v-model="draft.layout.senderCity" label="Ort" :maxlength="80" /></div>
        <div class="field-row"><UiFormField id="sender-email" v-model="draft.layout.senderEmail" label="E-Mail (optional)" type="email" :maxlength="120" /><UiFormField id="sender-phone" v-model="draft.layout.senderPhone" label="Telefon (optional)" type="tel" :maxlength="50" /></div>
        <label class="toggle-row"><span><strong>Nitoh-Logo im Briefkopf</strong><small>Schwarz & Sand. Bewusst reduziert.</small></span><input v-model="draft.layout.showLogo" type="checkbox" role="switch"></label>
        <button class="button next-button" @click="tab = 'recipient'">Weiter zum Empfänger <span>→</span></button>
      </template>
      <template v-else-if="tab === 'recipient'">
        <div class="section-caption"><span>ANSCHRIFT & ANREDE</span><span>02 / 04</span></div>
        <UiFormField id="recipient-name" v-model="draft.layout.recipientName" label="Empfänger / Unternehmen" :maxlength="160" />
        <UiFormField id="recipient-street" v-model="draft.layout.recipientStreet" label="Straße und Hausnummer" :maxlength="120" />
        <div class="field-row postal"><UiFormField id="recipient-postal" v-model="draft.layout.recipientPostalCode" label="Postleitzahl" :maxlength="20" /><UiFormField id="recipient-city" v-model="draft.layout.recipientCity" label="Ort" :maxlength="80" /></div>
        <UiFormField id="salutation" v-model="draft.layout.salutation" label="Anrede" :maxlength="160" hint="Zum Beispiel: Sehr geehrte Frau Musterfrau," />
        <div class="editor-tip"><span>↳</span> Die Anschrift wird automatisch im Fensterbereich des Briefes platziert.</div>
        <button class="button next-button" @click="tab = 'content'">Weiter zum Brieftext <span>→</span></button>
      </template>
      <template v-else-if="tab === 'content'">
        <div class="section-caption"><span>BETREFF & BRIEFTEXT</span><span>03 / 04</span></div>
        <UiFormField id="subject" v-model="draft.layout.subject" label="Betreff" :maxlength="180" />
        <UiFormField id="body" v-model="draft.content" label="Dein Brieftext" multiline :rows="10" :maxlength="20000" hint="Wiederkehrende Angaben kannst du als {{Platzhalter}} schreiben." />
        <div v-if="fields.length" class="placeholder-fields"><span class="section-caption">PLATZHALTER AUSFÜLLEN</span><UiFormField v-for="(field,index) in fields" :id="`value-${index}`" :key="field" :model-value="values[field] || ''" :label="field" :maxlength="5000" @update:model-value="values[field] = $event" /></div>
        <button class="button next-button" @click="tab = 'details'">Weiter zu den Details <span>→</span></button>
      </template>
      <template v-else>
        <div class="section-caption"><span>ABSCHLUSS & FORMAT</span><span>04 / 04</span></div>
        <div class="field-row"><UiFormField id="letter-city" v-model="draft.layout.city" label="Ausstellungsort" :maxlength="80" /><UiFormField id="letter-date" v-model="draft.layout.date" label="Datum" type="date" :maxlength="10" /></div>
        <UiFormField id="reference" v-model="draft.layout.reference" label="Ihr Zeichen / Referenz (optional)" :maxlength="60" />
        <UiFormField id="closing" v-model="draft.layout.closing" label="Grußformel" :maxlength="100" />
        <UiFormField id="signature" v-model="draft.layout.signature" label="Name unter der Unterschrift" :maxlength="120" />
        <UiFormField id="footer" v-model="draft.layout.footer" label="Fußzeile (optional)" :maxlength="200" hint="Zum Beispiel Firmen- oder Registerangaben." />
        <label class="toggle-row"><span><strong>Falz- und Lochmarken</strong><small>Für Faltung und Ablage.</small></span><input v-model="draft.layout.showFoldMarks" type="checkbox" role="switch"></label>
      </template>
    </div>
    <div class="editor-bottom"><span><span class="status-dot" /> A4 · Hochformat</span><button class="button dark" :disabled="busy" @click="$emit('generate')">{{ busy ? 'Brief wird erstellt …' : 'Brief fertigstellen' }} <span aria-hidden="true">↗</span></button></div>
  </section>
</template>
