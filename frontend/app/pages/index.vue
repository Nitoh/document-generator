<script setup lang="ts">
import { categories, starterTemplates } from '~/data/template-presets'
import type { DocumentTemplate, LetterDraft, LetterAttachment, LibraryImage } from '~/types/document'
import { archiveEntries, archiveEntry, saveLetter, openLetter, isArchived, archiveDays, type HistoryEntry, type LetterRecord, type Version, type TemplateOrigin } from '~/utils/studio-archive'
import { createMailDraft, downloadFile, encodeMailBytes } from '~/utils/letter-mail'
import { validateTemplate } from '~/utils/template'

const studio = useLetterStudio()
const { draft, hasDraft, values, templates, busy, loading, error, fields, previewBody, previewLayout, rendered, extraAttachments } = studio
const section = ref<'letter' | 'library' | 'history' | 'archive'>('letter')
const libraryKind = ref<'template' | 'form' | 'image'>('template')
const letterOpen = ref(false)
const activeLetter = ref<string>()
const activeLetterKey = 'nitoh.active-letter.v1'
const design = ref<LetterDraft>()
const designId = ref<string | null>(null)
const designKey = ref(0)
const form = ref<LetterAttachment>()
const builderOpen = ref(false)
const feedback = ref('')
const actionError = ref('')
const attachmentLibrary = ref<LetterAttachment[]>([])
const attachmentKey = 'nitoh.attachment-library.v1'
const history = ref<LetterRecord[]>([])
const images = ref<LibraryImage[]>([])
provide('studio-images', images)
const imageEdit = ref<Partial<LibraryImage>>()
const imageCategories = computed(() => [...new Set(['Unterschriften', 'Logos', ...images.value.map(image => image.category)])])
const baseline = ref('')
const origin = ref<TemplateOrigin>()
const activeOriginKey = 'nitoh.active-origin.v1'
const revisionBase = computed(() => libraryKind.value === 'template' ? design.value : libraryKind.value === 'form' ? form.value : imageEdit.value)
const dirty = computed(() => Boolean(revisionBase.value && JSON.stringify(revisionBase.value) !== baseline.value))
const timeline = computed(() => history.value.filter(item => isArchived(item.at) === (section.value === 'archive')))
const formSearch = ref('')
const formCategory = ref('')
const formCategories = computed(() => [...new Set(['Allgemeines', ...attachmentLibrary.value.map(item => item.category || 'Allgemeines')])].sort((a,b) => a.localeCompare(b, 'de')))
const visibleForms = computed(() => attachmentLibrary.value.filter(item =>
  (!formCategory.value || (item.category || 'Allgemeines') === formCategory.value) &&
  item.title.toLocaleLowerCase('de').includes(formSearch.value.trim().toLocaleLowerCase('de'))))

const versions = ref<Version[]>([])
const historyItem = ref<HistoryEntry>()
const matchingVersions = computed(() => versions.value.filter(version => version.kind === libraryKind.value && version.item.id === (libraryKind.value === 'form' ? form.value?.id : designId.value)))
const catalog = computed(() => [...templates.value, ...starterTemplates()])
const templateCategories = computed(() => [...new Set([...categories, ...catalog.value.map(item => item.category)])])
const pdf = useLetterPdf()
const preview = useTemplateRef<{ print: () => string | null }>('preview')
const mail = ref<{ pdf: File; subject: string }>()
const mailRecipient = ref('')
const mailEnabled = ref(false)
const mailSending = ref(false)
const mailError = ref('')
const mailEndpoint = `${useRuntimeConfig().app.baseURL}api/studio-mail`
const mailBody = ref('')
const mailDialog = useTemplateRef<HTMLDialogElement>('mailDialog')
const working = ref(false)
const locked = computed(() => busy.value || working.value || pdf.exporting.value)
const dateFormat = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' })

function beforeLeave(event: BeforeUnloadEvent) {
  if (dirty.value) { event.preventDefault(); event.returnValue = '' }
}
onMounted(() => window.addEventListener('beforeunload', beforeLeave))
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeLeave))
function discardChanges() {
  return !dirty.value || window.confirm('Ungespeicherte Änderungen verwerfen?')
}
function resetEditors() {
  design.value = undefined
  form.value = undefined
  imageEdit.value = undefined
  baseline.value = ''
}
function closeEditor() {
  if (!discardChanges()) return
  resetEditors()
  clearFeedback()
}
function openImage(item?: LibraryImage) {
  imageEdit.value = item ? JSON.parse(JSON.stringify(item)) : { name: '', category: '' }
  baseline.value = item ? JSON.stringify(imageEdit.value) : ''
  clearFeedback()
}
async function saveImage() {
  const item = imageEdit.value
  if (!item?.image || !item.name?.trim() || !item.category?.trim()) {
    actionError.value = 'Bitte wähle ein Bild und gib einen Namen und eine Kategorie an.'
    return
  }
  try {
    const saved = { id: item.id ?? crypto.randomUUID(), at: new Date().toISOString(),
      name: item.name.trim(), category: item.category.trim(), image: item.image }
    await archiveEntry('images', saved)
    images.value = [saved, ...images.value.filter(image => image.id !== saved.id)]
    imageEdit.value = saved
    baseline.value = JSON.stringify(saved)
    actionError.value = ''
    feedback.value = 'Bild in der Library gespeichert.'
  } catch (cause) { report(cause, 'Das Bild konnte nicht gespeichert werden.') }
}
async function showRecord(item: LetterRecord) {
  try { historyItem.value = await openLetter(item) }
  catch (cause) { report(cause, 'Der Brief konnte nicht geöffnet werden.') }
}

onMounted(async () => {
  try {
    activeLetter.value = localStorage.getItem(activeLetterKey) ?? undefined
    origin.value = JSON.parse(localStorage.getItem(activeOriginKey) ?? 'null') ?? undefined
    const stored = JSON.parse(localStorage.getItem(attachmentKey) ?? '[]')
    if (Array.isArray(stored)) attachmentLibrary.value = stored
    const [savedVersions, savedHistory, savedImages] = await Promise.all([archiveEntries('versions'), archiveEntries('letters'), archiveEntries('images')])
    versions.value = savedVersions
    history.value = savedHistory
    images.value = savedImages
  } catch { actionError.value = 'Die lokal gespeicherten Daten konnten nicht vollständig geladen werden.' }
  if (studio.localMode) return
  mailEnabled.value = (await $fetch<{ enabled: boolean }>(mailEndpoint).catch(() => null))?.enabled === true
})

function report(cause: unknown, fallback: string) { actionError.value = cause instanceof Error ? cause.message : fallback }
function clearFeedback() { feedback.value = ''; actionError.value = ''; error.value = '' }
function navigate(target: typeof section.value) {
  if ((target === section.value && target !== 'letter') || (section.value === 'library' && !discardChanges())) return
  if (section.value === 'library') resetEditors()
  clearFeedback()
  section.value = target
  if (target === 'letter') letterOpen.value = false
  if (target === 'history' || target === 'archive') historyItem.value = undefined
  window.scrollTo(0, 0)
}
function changeLibrary(kind: typeof libraryKind.value) {
  if (kind === libraryKind.value || !discardChanges()) return
  resetEditors()
  clearFeedback()
  libraryKind.value = kind
}
function choose(item: DocumentTemplate) {
  studio.choose(item)
  startLetterId()
  const revisions = versions.value.filter(version => version.kind === 'template' && version.item.id === item.id)
  origin.value = { name: item.name, version: revisions.length || undefined, revisionId: revisions[0]?.id }
  try { localStorage.setItem(activeOriginKey, JSON.stringify(origin.value)) } catch { /* Session still retains provenance. */ }
  letterOpen.value = true
  clearFeedback()
  window.scrollTo(0, 0)
}
function startLetterId() {
  activeLetter.value = crypto.randomUUID()
  try { localStorage.setItem(activeLetterKey, activeLetter.value) }
  catch { /* The active letter still works for this browser session. */ }
}
function resumeLetter() {
  if (!activeLetter.value) startLetterId()
  clearFeedback()
  letterOpen.value = true
}
function openDesign(item: DocumentTemplate) {
  designKey.value++
  const { name, category, type, content, layout } = item
  design.value = JSON.parse(JSON.stringify({ name, category, type, content, layout }))
  baseline.value = JSON.stringify(design.value)
  designId.value = item.id.startsWith('starter:') ? null : item.id
  clearFeedback()
  window.scrollTo(0, 0)
}
function createTemplate(template: LetterDraft) {
  designKey.value++
  builderOpen.value = false
  designId.value = null
  design.value = template
  baseline.value = ''
}
function saveAsTemplate() {
  navigate('library')
  libraryKind.value = 'template'
  createTemplate(JSON.parse(JSON.stringify({
    ...draft, layout: { ...draft.layout, attachments: previewUnresolvedAttachments() }
  })))
}
function previewUnresolvedAttachments() {
  const attached = new Map((draft.layout.attachments ?? []).map(item => [item.id, item]))
  for (const item of extraAttachments.value) if (!attached.has(item.id)) attached.set(item.id, item)
  return [...attached.values()]
}
async function saveVersion(version: Version) {
  await archiveEntry('versions', version)
  versions.value = [version, ...versions.value]
}
async function saveDesign() {
  if (!design.value || locked.value) return
  clearFeedback()
  if ((design.value.layout.attachments?.length ?? 0) > 5) {
    actionError.value = 'Eine Vorlage kann bis zu fünf feste Anlagen enthalten.'
    return
  }
  if (!design.value.layout.subject.trim() || !design.value.layout.salutation.trim()) {
    actionError.value = 'Bitte gib Betreff und Anrede ein.'
    return
  }
  working.value = true
  try {
    const existing = templates.value.find(item => item.id === designId.value)
    if (existing && !matchingVersions.value.length) await saveVersion({ kind: 'template', item: existing, at: new Date().toISOString(), id: crypto.randomUUID() })
    const saved = await studio.saveTemplate(design.value, designId.value)
    if (!saved) return
    designId.value = saved.id
    await saveVersion({ kind: 'template', item: saved, at: new Date().toISOString(), id: crypto.randomUUID() })
    baseline.value = JSON.stringify(design.value)
    feedback.value = 'Briefvorlage als neue Version gespeichert.'
  } catch (cause) { report(cause, 'Die Vorlagenversion konnte nicht gespeichert werden.') }
  finally { working.value = false }
}
function openForm(item?: LetterAttachment) {
  clearFeedback()
  form.value = item ? JSON.parse(JSON.stringify(item)) : { id: crypto.randomUUID(), title: '', content: '', category: 'Allgemeines' }
  form.value!.category ||= 'Allgemeines'
  baseline.value = item ? JSON.stringify(form.value) : ''
}
async function saveForm() {
  if (!form.value || working.value) return
  clearFeedback()
  working.value = true
  try {
    const item = JSON.parse(JSON.stringify({ ...form.value, title: form.value.title.trim(), content: form.value.content.trim() })) as LetterAttachment
    if (!item.category?.trim()) throw new Error('Bitte wähle eine Formularkategorie.')
    item.category = item.category.trim()
    if (item.title.length > 200) throw new Error('Der Formulartitel darf höchstens 200 Zeichen enthalten.')
    validateTemplate(item.title)
    validateTemplate(item.content)
    const existing = attachmentLibrary.value.find(entry => entry.id === item.id)
    if (existing && !matchingVersions.value.length) await saveVersion({ kind: 'form', item: existing, at: new Date().toISOString(), id: crypto.randomUUID() })
    const next = [...attachmentLibrary.value.filter(entry => entry.id !== item.id), item]
    localStorage.setItem(attachmentKey, JSON.stringify(next))
    attachmentLibrary.value = next
    await saveVersion({ kind: 'form', item, at: new Date().toISOString(), id: crypto.randomUUID() })
    baseline.value = JSON.stringify(form.value)
    feedback.value = 'Formular als neue Version gespeichert.'
  } catch (cause) { report(cause, 'Das Formular konnte nicht gespeichert werden.') }
  finally { working.value = false }
}
function versionChanges(version: Version, previous?: Version) {
  if (!previous || previous.kind !== version.kind) return 'Erster gespeicherter Stand'
  if (version.kind === 'form' && previous.kind === 'form') {
    return [
      version.item.title !== previous.item.title && 'Titel',
      version.item.category !== previous.item.category && 'Kategorie',
      version.item.content !== previous.item.content && 'Formulartext',
      JSON.stringify(version.item.textFormat) !== JSON.stringify(previous.item.textFormat) && 'Formatierung',
      JSON.stringify(version.item.image) !== JSON.stringify(previous.item.image) && 'Bild'
    ].filter(Boolean).join(', ') || 'Gleicher Inhalt'
  }
  if (version.kind !== 'template' || previous.kind !== 'template') return ''
  const current = version.item
  const old = previous.item
  const without = ({ attachments, logoImage, signatureImage, bodyFormats, sectionFormats, ...layout }: LetterDraft['layout']) => layout
  return [
    current.name !== old.name && 'Name',
    current.category !== old.category && 'Kategorie',
    current.content !== old.content && 'Brieftext',
    JSON.stringify(without(current.layout)) !== JSON.stringify(without(old.layout)) && 'Briefeinstellungen',
    JSON.stringify(current.layout.attachments) !== JSON.stringify(old.layout.attachments) && 'Anlagen',
    JSON.stringify([current.layout.bodyFormats, current.layout.sectionFormats]) !== JSON.stringify([old.layout.bodyFormats, old.layout.sectionFormats]) && 'Formatierung',
    JSON.stringify([current.layout.logoImage, current.layout.signatureImage]) !== JSON.stringify([old.layout.logoImage, old.layout.signatureImage]) && 'Bilder'
  ].filter(Boolean).join(', ') || 'Gleicher Inhalt'
}
function restore(version: Version) {
  if (!discardChanges()) return
  if (version.kind === 'template') openDesign(version.item)
  else openForm(version.item)
  baseline.value = ''
  feedback.value = 'Version zum Bearbeiten geladen. Speichern legt eine neue Version an.'
}
function toggleAttachment(item: LetterAttachment) {
  if (extraAttachments.value.some(extra => extra.id === item.id)) extraAttachments.value = extraAttachments.value.filter(extra => extra.id !== item.id)
  else if (previewUnresolvedAttachments().length < 5) extraAttachments.value = [...extraAttachments.value, item]
  else actionError.value = 'Ein Brief kann bis zu fünf Anlagen enthalten.'
}
async function currentLetter(): Promise<HistoryEntry | undefined> {
  if (historyItem.value && (section.value === 'history' || section.value === 'archive')) return historyItem.value
  await studio.generate()
  if (rendered.value === null) return
  return { id: activeLetter.value!, at: new Date().toISOString(), layout: previewLayout.value, body: rendered.value, origin: origin.value }
}
async function remember(entry: HistoryEntry) {
  if (section.value === 'history' || section.value === 'archive') return
  const record = await saveLetter(entry)
  history.value = [record, ...history.value.filter(item => item.id !== record.id)].sort((a, b) => b.at.localeCompare(a.at))
  if (record.id !== activeLetter.value) {
    activeLetter.value = record.id
    try { localStorage.setItem(activeLetterKey, record.id) } catch { /* History is already saved. */ }
  }
}
async function output(action: 'save' | 'print' | 'pdf' | 'mail') {
  if (locked.value) return
  clearFeedback()
  working.value = true
  try {
    const entry = await currentLetter()
    if (!entry) return
    if (action === 'print') {
      await nextTick()
      const issue = preview.value?.print()
      if (issue) throw new Error(issue)
      await remember(entry)
      return
    }
    const file = await pdf.createFile(entry.layout, entry.body)
    await remember(entry)
    if (action === 'pdf') downloadFile(file)
    if (action === 'save') feedback.value = 'Brief in der Historie gespeichert.'
    if (action === 'mail') {
      mail.value = { pdf: file, subject: entry.layout.subject }
      mailRecipient.value = ''
      mailBody.value = ''
      mailError.value = ''
      await nextTick()
      mailDialog.value?.showModal()
    }
  } catch (cause) { report(cause, 'Der Brief konnte nicht fertiggestellt werden.') }
  finally { working.value = false }
}
async function shareMail() {
  if (!mail.value) return
  try {
    const draftFile = await createMailDraft(mail.value.pdf, mail.value.subject, mailRecipient.value, mailBody.value)
    downloadFile(draftFile)
    mailDialog.value?.close()
    feedback.value = 'E-Mail-Entwurf mit PDF gespeichert. Öffne die Datei in deinem Mailprogramm.'
  } catch { mailError.value = 'Der E-Mail-Entwurf konnte nicht erstellt werden.' }
}
const canShare = computed(() => mail.value && typeof navigator !== 'undefined' && navigator.canShare?.({ files: [mail.value.pdf] }))
async function sharePdf() {
  if (!mail.value) return
  try {
    await navigator.share({ files: [mail.value.pdf], title: mail.value.subject })
    mailDialog.value?.close()
  } catch (cause) {
    if (!(cause instanceof DOMException && cause.name === 'AbortError')) mailError.value = 'Die PDF konnte nicht geteilt werden.'
  }
}
async function sendMail() {
  if (!mail.value || mailSending.value) return
  mailError.value = ''
  mailSending.value = true
  try {
    if (mail.value.pdf.size > 5_000_000) throw new Error('Für den direkten Versand darf die PDF höchstens 5 MB groß sein.')
    await $fetch(mailEndpoint, {
      method: 'POST', retry: 0, timeout: 65_000,
      body: {
        recipient: mailRecipient.value.trim(),
        subject: mail.value.subject.replace(/[\r\n]+/g, ' '),
        body: mailBody.value,
        pdf: encodeMailBytes(new Uint8Array(await mail.value.pdf.arrayBuffer()))
      }
    })
    mailDialog.value?.close()
    feedback.value = 'Der Mailserver hat den Brief zum Versand angenommen.'
  } catch (cause) {
    const response = cause as { data?: { data?: { detail?: string } }; message?: string }
    mailError.value = response.data?.data?.detail || response.message || 'Der Brief konnte nicht gesendet werden.'
  } finally { mailSending.value = false }
}
</script>

<template>
  <div class="studio-shell">
    <StudioSidebar :section="section" @navigate="navigate" />
    <main class="studio-main">
      <header class="section-header no-print">
        <h1>{{ section === 'letter' ? 'Brief erstellen' : section === 'library' ? 'Library' : section === 'archive' ? 'Archiv' : 'Briefhistorie' }}</h1>
        <p v-if="section === 'letter' && !letterOpen">Wähle eine Briefvorlage aus deiner Library.</p>
        <p v-else-if="section === 'library'">Gestalte Briefvorlagen und Formulare und verwalte ihre Versionen.</p>
        <p v-else-if="section === 'history'">Briefe der letzten {{ archiveDays }} Tage auf diesem Gerät.</p>
              <p v-else-if="section === 'archive'">Briefe ab {{ archiveDays }} Tagen. Sie lassen sich aus den gespeicherten Bestandteilen erneut öffnen.</p>
      </header>

      <div v-if="section === 'letter' && letterOpen" class="document-bar sticky-actions no-print">
        <div><button class="button subtle" @click="navigate('letter')">Vorlage wechseln</button><strong>{{ draft.name }}</strong></div>
        <div class="document-actions">
          <button class="button subtle" @click="saveAsTemplate">Als Vorlage speichern</button>
          <button class="button subtle" :disabled="locked" @click="output('print')">Drucken</button>
          <button class="button dark" :disabled="locked" @click="output('pdf')">PDF herunterladen</button>
          <button class="button subtle" :disabled="locked" @click="output('mail')">Per E-Mail</button>
        </div>
      </div>
      <div v-if="error || actionError || feedback" class="studio-feedback no-print" :class="{ error: error || actionError }" :role="error || actionError ? 'alert' : 'status'">{{ error || actionError || feedback }}</div>

      <template v-if="section === 'letter'">
        <p v-if="loading && !letterOpen">Vorlagen werden geladen …</p>
        <button v-if="!letterOpen && hasDraft" class="button subtle no-print" @click="resumeLetter">Letzten Entwurf fortsetzen</button>
        <StudioTemplateCatalog v-if="!letterOpen" :items="catalog" @select="choose" />
        <template v-else>
          <details v-if="attachmentLibrary.length" class="letter-attachments no-print">
            <summary>Formularanhänge für diesen Brief</summary>
            <label v-for="item in attachmentLibrary" :key="item.id" class="attachment-option">
              <input type="checkbox" :checked="previewUnresolvedAttachments().some(attached => attached.id === item.id)" :disabled="draft.layout.attachments?.some(attached => attached.id === item.id) || (previewUnresolvedAttachments().length >= 5 && !extraAttachments.some(attached => attached.id === item.id))" @change="toggleAttachment(item)">
              {{ item.title }} <small v-if="draft.layout.attachments?.some(attached => attached.id === item.id)">· Feste Anlage der Vorlage</small>
            </label>
          </details>
          <div class="studio-workspace">
            <StudioLetterEditor :draft="draft" :values="values" :fields="fields" :busy="locked" @generate="output('save')" />
            <LetterPreview ref="preview" :layout="previewLayout" :body="previewBody" :ready="rendered !== null" :designer="rendered === null" />
          </div>
        </template>
      </template>

      <template v-if="section === 'library'">
        <div class="library-heading no-print">
          <nav class="library-tabs" aria-label="Library-Typen">
            <button class="library-type" :aria-pressed="libraryKind === 'template'" @click="changeLibrary('template')">Briefvorlagen</button>
            <button class="library-type" :aria-pressed="libraryKind === 'form'" @click="changeLibrary('form')">Formulare</button>
            <button class="library-type" :aria-pressed="libraryKind === 'image'" @click="changeLibrary('image')">Bilder</button>
          </nav>
          <StudioAddItem v-if="!revisionBase" :label="libraryKind === 'template' ? 'Neue Briefvorlage' : libraryKind === 'form' ? 'Neues Formular' : 'Neues Bild'" @add="libraryKind === 'template' ? builderOpen = true : libraryKind === 'form' ? openForm() : openImage()" />
        </div>
        <template v-if="libraryKind === 'template'">
          <div v-if="design" class="document-bar sticky-actions no-print">
            <div><button class="button subtle" @click="closeEditor">Zurück zur Library</button><strong>Vorlagendesigner</strong><small v-if="dirty">Ungespeichert</small></div>
            <button class="button dark" :disabled="locked" @click="saveDesign">Vorlage speichern</button>
          </div>
          <div v-if="design" class="studio-workspace designer-workspace">
            <StudioTemplateDesigner :key="designKey" v-model="design" :library="attachmentLibrary" :categories="templateCategories" />
            <StudioDesignPreview :draft="design" />
          </div>
          <template v-else>
            <StudioTemplateCatalog :items="catalog" manage @select="openDesign" @remove="studio.removeTemplate" />
          </template>
        </template>
        <template v-else-if="libraryKind === 'form'">
          <StudioFormDesigner v-if="form" :form="form" :categories="formCategories" @close="closeEditor" @save="saveForm" />
          <StudioCategoryBrowser v-else v-model:search="formSearch" v-model:category="formCategory" :categories="formCategories" search-label="Formulare suchen">
            <p v-if="!visibleForms.length" class="muted">Keine passenden Formulare gefunden.</p>
            <ul class="catalog-list">
              <li v-for="item in visibleForms" :key="item.id"><strong>{{ item.title }}</strong><button class="button subtle" @click="openForm(item)">Bearbeiten</button></li>
            </ul>
          </StudioCategoryBrowser>
        </template>
        <template v-else>
          <section v-if="imageEdit" class="editor-panel design-fields image-editor">
            <UiFormField id="image-name" :model-value="imageEdit.name || ''" label="Bildname" @update:model-value="imageEdit.name = $event" />
            <StudioCategoryField id="image-category" :model-value="imageEdit.category || ''" :categories="imageCategories" @update:model-value="imageEdit.category = $event" />
            <StudioImageField :model-value="imageEdit.image" label="Bilddatei" library-entry @update:model-value="imageEdit.image = $event ?? undefined" />
            <div class="catalog-actions"><button class="button subtle" @click="closeEditor">Abbrechen</button><button class="button dark" @click="saveImage">Bild speichern</button></div>
          </section>
          <StudioImageCatalog v-else :items="images" @edit="openImage" />
        </template>
        <section v-if="matchingVersions.length && (libraryKind === 'template' ? design : form)" class="catalog no-print">
          <h2>Versionen</h2>
          <ul class="catalog-list">
            <li v-for="(version, index) in matchingVersions" :key="version.id">
              <div><strong>Version {{ matchingVersions.length - index }}</strong><small>{{ dateFormat.format(new Date(version.at)) }} · {{ versionChanges(version, matchingVersions[index + 1]) }}</small></div>
              <button class="button subtle" @click="restore(version)">Zum Bearbeiten laden</button>
            </li>
          </ul>
        </section>
      </template>

      <template v-if="section === 'history' || section === 'archive'">
        <template v-if="historyItem">
          <div class="document-bar sticky-actions no-print"><button class="button subtle" @click="historyItem = undefined; clearFeedback()">{{ section === 'archive' ? 'Zurück zum Archiv' : 'Zurück zur Historie' }}</button><div class="document-actions"><button class="button subtle" :disabled="locked" @click="output('print')">Drucken</button><button class="button dark" :disabled="locked" @click="output('pdf')">PDF herunterladen</button><button class="button subtle" :disabled="locked" @click="output('mail')">Per E-Mail</button></div></div>
          <LetterPreview ref="preview" :layout="historyItem.layout" :body="historyItem.body" :ready="true" />
        </template>
        <template v-else>
          <StudioLetterTimeline :letters="timeline" :archived="section === 'archive'" @open="showRecord" />
        </template>
      </template>
    </main>
    <StudioTemplateBuilder v-if="builderOpen" :categories="templateCategories" @close="builderOpen = false" @create="createTemplate" />
    <dialog v-if="mail" ref="mailDialog" class="library-dialog no-print" aria-labelledby="mail-title" @close="mail = undefined">
      <form @submit.prevent="mailEnabled ? sendMail() : shareMail()">
        <div class="dialog-heading"><h2 id="mail-title">Brief per E-Mail</h2><button type="button" class="icon-button" aria-label="Schließen" :disabled="mailSending" @click="mailDialog?.close()">×</button></div>
        <p v-if="mailEnabled" class="muted">Der Brief wird mit der PDF als Anhang an die eingegebene Adresse gesendet.</p>
        <p v-else class="muted">Der E-Mail-Entwurf enthält deinen Brief als PDF. Den Versand bestätigst du im Mailprogramm.</p>
        <UiFormField id="mail-recipient" v-model="mailRecipient" label="Empfänger-E-Mail" type="email" :maxlength="254" />
        <UiFormField id="mail-body" v-model="mailBody" label="Nachricht" multiline :rows="4" :maxlength="5000" />
        <p v-if="mailError" role="alert">{{ mailError }}</p>
        <div class="catalog-actions"><button v-if="canShare" type="button" class="button subtle" @click="sharePdf">PDF über System teilen</button><button v-if="mailEnabled" type="button" class="button subtle" :disabled="mailSending" @click="shareMail">E-Mail-Entwurf herunterladen</button><button class="button dark" type="submit" :disabled="mailSending">{{ mailSending ? 'Wird gesendet …' : mailEnabled ? 'E-Mail senden' : 'E-Mail-Entwurf herunterladen (.eml)' }}</button></div>
      </form>
    </dialog>
  </div>
</template>
