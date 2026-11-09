<script setup lang="ts">
import type { DocumentTemplate, LetterDraft, LetterAttachment } from '~/types/document'
const studio = useLetterStudio()
const { draft, values, templates, busy, loading, error, message, draftStatus, fields, previewBody, previewLayout, rendered, localMode, extraAttachments } = studio
const libraryOpen = ref(false)
const builderOpen = ref(false)
const designerOpen = ref(false)
const attachmentsOpen = ref(false)
const attachmentLibrary = ref<LetterAttachment[]>([])
const attachmentKey = 'nitoh.attachment-library.v1'
onMounted(() => {
  try {
    const stored = JSON.parse(localStorage.getItem(attachmentKey) ?? '[]')
    if (Array.isArray(stored)) attachmentLibrary.value = stored
  } catch { printError.value = 'Die Formularbibliothek konnte nicht geladen werden.' }
})
function saveAttachment(item: LetterAttachment) {
  const next = [...attachmentLibrary.value.filter(existing => existing.id !== item.id), item]
  localStorage.setItem(attachmentKey, JSON.stringify(next))
  attachmentLibrary.value = next
}
function toggleAttachment(item: LetterAttachment) {
  const remaining = extraAttachments.value.filter(extra => extra.id !== item.id)
  extraAttachments.value = remaining.length === extraAttachments.value.length ? [...remaining, item] : remaining
}
function applyDesign(content: string, attachments: LetterAttachment[]) {
  draft.content = content
  draft.layout.attachments = attachments
  extraAttachments.value = extraAttachments.value.filter(extra => !attachments.some(item => item.id === extra.id))
  designerOpen.value = false
}
function createTemplate(template: LetterDraft) { studio.createTemplate(template); builderOpen.value = false; designerOpen.value = true }
function openBuilder() { libraryOpen.value = false; builderOpen.value = true }
const pdf = useLetterPdf()
const printError = ref('')
const preview = useTemplateRef<{ print: () => string | null }>('preview')
function choose(item: DocumentTemplate) { studio.choose(item); libraryOpen.value = false }
async function downloadPdf() {
  printError.value = ''
  await studio.generate()
  if (rendered.value === null) return
  try { await pdf.download(previewLayout.value, rendered.value) }
  catch (cause) { printError.value = cause instanceof Error ? cause.message : 'Die PDF konnte nicht erstellt werden.' }
}
async function printLetter() {
  printError.value = ''
  await studio.generate()
  if (rendered.value === null) return
  await nextTick()
  printError.value = preview.value?.print() || ''
}
</script>
<template>
  <div class="studio-shell">
    <StudioSidebar :local-mode="localMode" :template-count="templates.length" @library="libraryOpen = true" @fresh="openBuilder" />
    <main class="studio-main">
      <header class="topbar no-print"><span>DEIN DIGITALER SCHREIBTISCH</span><div><span class="status-dot" />{{ draftStatus }}</div></header>
      <section class="studio-intro no-print"><div><div class="eyebrow"><span class="small-rule" /> WORTE MIT WIRKUNG</div><h1>Ein guter Brief.<br><em>Ein bleibender Eindruck.</em></h1><p>Von der ersten Zeile bis zum letzten Detail. Gestalte Briefe,<br class="desktop-break"> die auf Papier genauso gut wirken wie deine Worte.</p></div><div class="intro-format"><span>DIN</span><strong>5008</strong><span>FORM B · A4</span></div></section>
      <div class="document-bar no-print"><div><span class="file-badge" aria-hidden="true">▤</span><div><label for="template-name">VORLAGENNAME</label><input id="template-name" v-model="draft.name" maxlength="200" aria-label="Vorlagenname"></div></div><div class="document-actions"><button class="button subtle" :disabled="busy" @click="studio.saveTemplate">Vorlage speichern</button><button class="button subtle print-action" :disabled="busy" @click="printLetter">Drucken</button><button class="button dark" :disabled="busy || pdf.exporting.value" @click="downloadPdf">{{ pdf.exporting.value ? 'PDF wird erstellt …' : 'PDF herunterladen' }} <span aria-hidden="true">↗</span></button></div></div>
      <div v-if="error || printError || message" class="studio-feedback no-print" :class="{ error: error || printError }" :role="error || printError ? 'alert' : 'status'">{{ error || printError || message }}</div>
      <div class="template-metadata no-print"><UiFormField id="draft-category" v-model="draft.category" label="Kategorie der Vorlage" :maxlength="80" /><StudioAppearancePicker v-model:design="draft.layout.design" v-model:header="draft.layout.headerStyle" id-prefix="current" /></div>
      <div class="document-actions no-print designer-toolbar">
        <button class="button subtle" @click="designerOpen = true">Vorlagendesigner</button>
        <button class="button subtle" @click="attachmentsOpen = true">Formularanhänge ({{ previewLayout.attachments?.length ?? 0 }})</button>
      </div>
      <div class="studio-workspace"><StudioLetterEditor :draft="draft" :values="values" @update:draft="Object.assign(draft, $event)" @update:values="Object.assign(values, $event)" :fields="fields" :busy="busy" @generate="studio.generate" /><LetterPreview ref="preview" :layout="previewLayout" :body="previewBody" :ready="rendered !== null" /></div>
      <footer class="studio-footer no-print"><span><strong>NITOH</strong> · Mit Sorgfalt geschrieben.</span><span>Beim Drucken: A4 · 100 % · Browser-Kopf-/Fußzeilen aus.</span></footer>
    </main>
    <StudioTemplateLibrary v-if="libraryOpen" :templates="templates" :loading="loading" :busy="busy" :local-mode="localMode" @close="libraryOpen = false" @choose="choose" @remove="studio.removeTemplate" @refresh="studio.loadTemplates" @create="openBuilder" />
    <StudioTemplateDesigner v-if="designerOpen" :content="draft.content" :attachments="draft.layout.attachments ?? []" :library="attachmentLibrary" @close="designerOpen = false" @apply="applyDesign" />
    <StudioAttachmentLibrary v-if="attachmentsOpen" :library="attachmentLibrary" :defaults="draft.layout.attachments ?? []" :extras="extraAttachments" @close="attachmentsOpen = false" :save-item="saveAttachment" @toggle="toggleAttachment" />
    <StudioTemplateBuilder v-if="builderOpen" @close="builderOpen = false" @create="createTemplate" />
  </div>
</template>
