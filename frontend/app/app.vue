<script setup lang="ts">
type DocumentType = 'Letter' | 'Invoice' | 'Reminder'
interface Template { id: string; name: string; type: DocumentType; content: string; createdAt: string }
const example = 'Hallo {{Name}},\n\nhiermit bestätigen wir deinen Termin am {{Datum}}.\n\nViele Grüße\nDein Team'
const template = ref(example)
const name = ref('Terminbestätigung')
const type = ref<DocumentType>('Letter')
const selectedId = ref<string | null>(null)
const templates = ref<Template[]>([])
const values = reactive<Record<string, string>>(Object.create(null))
const result = ref<string | null>(null)
const message = ref('')
const error = ref('')
const libraryMessage = ref('')
const libraryError = ref('')
const busy = ref(false)
const saving = ref(false)
const loading = ref(true)
let revision = 0
const fields = computed(() => [...new Set([...template.value.matchAll(/\{\{\s*([\p{L}_][\p{L}\p{N}_]*)\s*\}\}/gu)].map(match => match[1]!))])
watch([template, values], () => {
  revision++
  result.value = null
  message.value = ''
  error.value = ''
}, { deep: true, flush: 'sync' })
function errorText(cause: unknown): string {
  const e = cause as { data?: { detail?: string; errors?: Record<string, string[]> }; message?: string }
  return e.data?.detail || Object.values(e.data?.errors || {}).flat().join(' ') || 'Die Anfrage ist fehlgeschlagen. Bitte prüfe die Verbindung zur API und Datenbank.'
}
async function loadTemplates() {
  loading.value = true
  libraryError.value = ''
  try { templates.value = await $fetch<Template[]>('/api/templates', { timeout: 15000 }) }
  catch (cause) { libraryError.value = errorText(cause) }
  finally { loading.value = false }
}
onMounted(loadTemplates)
function selectTemplate(item: Template) {
  revision++
  selectedId.value = item.id
  name.value = item.name
  type.value = item.type
  template.value = item.content
  result.value = null
  message.value = ''
  libraryMessage.value = ''
  libraryError.value = ''
}
function newTemplate() {
  revision++
  selectedId.value = null
  name.value = ''
  type.value = 'Letter'
  template.value = ''
  for (const key of Object.keys(values)) delete values[key]
  result.value = null
  libraryMessage.value = ''
}
function loadExample() {
  revision++
  selectedId.value = null
  name.value = 'Terminbestätigung'
  type.value = 'Letter'
  template.value = example
  values.Name = 'Erika'
  values.Datum = '15.11.2026'
}
async function saveTemplate() {
  if (saving.value) return
  saving.value = true
  libraryError.value = ''; libraryMessage.value = ''
  const id = selectedId.value
  const payload = { name: name.value, type: type.value, content: template.value }
  try {
    const saved = await $fetch<Template>(id ? `/api/templates/${id}` : '/api/templates', {
      method: id ? 'PUT' : 'POST', body: payload, timeout: 15000
    })
    selectedId.value = saved.id
    libraryMessage.value = 'Vorlage gespeichert.'
    await loadTemplates()
  } catch (cause) { libraryError.value = errorText(cause) }
  finally { saving.value = false }
}
async function deleteTemplate() {
  if (!selectedId.value || saving.value) return
  if (!window.confirm('Diese Vorlage dauerhaft löschen?')) return
  saving.value = true
  libraryError.value = ''
  try {
    await $fetch(`/api/templates/${selectedId.value}`, { method: 'DELETE', timeout: 15000 })
    newTemplate()
    libraryMessage.value = 'Vorlage gelöscht.'
    await loadTemplates()
  } catch (cause) { libraryError.value = errorText(cause) }
  finally { saving.value = false }
}
async function generate() {
  if (busy.value) return
  busy.value = true
  result.value = null; error.value = ''; message.value = 'Dein Dokument wird erstellt …'
  const requestRevision = revision
  const payload = Object.fromEntries(fields.value.map(field => [field, values[field] || '']))
  try {
    const generated = await $fetch<{ content: string }>('/api/documents/generate', {
      method: 'POST', body: { template: template.value, values: payload }, timeout: 15000
    })
    if (requestRevision !== revision) return
    result.value = generated.content
    message.value = 'Fertig! Dein Dokument steht unten bereit.'
  } catch (cause) {
    if (requestRevision === revision) { error.value = errorText(cause); message.value = '' }
  } finally { busy.value = false }
}
function download() {
  if (result.value === null) return
  const url = URL.createObjectURL(new Blob([result.value], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url; link.download = 'dokument.txt'; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
</script>

<template>
  <header><a href="/" class="brand">◧ Document Generator</a><span>Deine Vorlagen. Deine Dokumente.</span></header>
  <main>
    <div class="intro"><p class="eyebrow">VON DER VORLAGE ZUM DOKUMENT</p><h1>Weniger tippen.<br>Mehr erledigen.</h1><p>Speichere Vorlagen und erstelle daraus persönliche Dokumente.</p></div>
    <section class="card library" aria-labelledby="library-title">
      <div class="result-head"><div><div class="step">DEINE VORLAGEN</div><h2 id="library-title">Einmal schreiben. Wiederverwenden.</h2></div><button class="secondary" type="button" :disabled="saving" @click="newTemplate">Neue Vorlage</button></div>
      <p v-if="loading" role="status">Vorlagen werden geladen …</p>
      <p v-else-if="!templates.length && !libraryError">Noch keine Vorlagen. Erstelle unten deine erste.</p>
      <div class="template-list"><button v-for="item in templates" :key="item.id" class="template-chip" :class="{ active: selectedId === item.id }" :disabled="saving" :aria-pressed="selectedId === item.id" @click="selectTemplate(item)">{{ item.name }}</button></div>
      <p v-if="libraryError" class="error" role="alert">{{ libraryError }} <button class="secondary" @click="loadTemplates">Erneut laden</button></p>
      <p v-if="libraryMessage" role="status">{{ libraryMessage }}</p>
    </section>
    <div class="workspace">
      <section class="card"><div class="step">01 · VORLAGE</div><h2>Was möchtest du schreiben?</h2>
        <form @submit.prevent="saveTemplate">
          <fieldset :disabled="saving">
            <label for="name">Vorlagenname</label><input id="name" v-model="name" required maxlength="200">
            <label for="type">Dokumenttyp</label><select id="type" v-model="type"><option value="Letter">Brief</option><option value="Invoice">Rechnung</option><option value="Reminder">Erinnerung</option></select>
            <label for="template">Dein Vorlagentext</label><textarea id="template" v-model="template" required maxlength="20000" spellcheck="false" />
            <p class="hint">Platzhalter: <span v-pre>{{Name}}</span> · Buchstaben, Ziffern und _ · Groß-/Kleinschreibung beachten.</p>
            <div class="actions"><button type="submit">{{ saving ? 'Wird gespeichert …' : selectedId ? 'Änderungen speichern' : 'Vorlage speichern' }}</button><button class="secondary" type="button" @click="loadExample">Beispiel laden</button><button v-if="selectedId" class="danger" type="button" @click="deleteTemplate">Vorlage löschen</button></div>
          </fieldset>
        </form>
      </section>
      <section class="card"><div class="step">02 · PERSONALISIEREN</div><h2>Mach es persönlich.</h2>
        <form @submit.prevent="generate"><div v-for="(field, index) in fields" :key="field"><label :for="`field-${index}`">{{ field }}</label><input :id="`field-${index}`" v-model="values[field]" required maxlength="5000"></div>
          <p v-if="!fields.length">Diese Vorlage benötigt keine Werte.</p><button class="generate" type="submit" :disabled="busy || !template.trim()">{{ busy ? 'Wird erstellt …' : 'Dokument erstellen →' }}</button>
        </form><p role="status" aria-live="polite">{{ message }}</p><p v-if="error" class="error" role="alert">{{ error }}</p>
      </section>
    </div>
    <section class="card result"><div class="result-head"><div><div class="step">03 · DEIN ERGEBNIS</div><h2>Bereit zum Verwenden.</h2></div><button class="secondary" :disabled="result === null" @click="download">Als .txt herunterladen</button></div><pre tabindex="0">{{ result ?? 'Dein fertiges Dokument erscheint hier.' }}</pre></section>
    <footer>Gespeicherte Vorlagen bleiben in der Datenbank erhalten. Eingesetzte Werte und erstellte Dokumente werden nicht gespeichert.</footer>
  </main>
</template>
