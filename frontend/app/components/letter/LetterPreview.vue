<script setup lang="ts">
import type { LetterLayout } from '~/types/document'
import { defaultFormat, formatBody, formatLines, lineHeightMm } from '~/utils/letter-format'
import type { TextBlockFormat } from '~/types/document'
import { imageGeometry } from '~/utils/letter-geometry'
import { attachmentPages, paginateLines } from '~/utils/letter'
const props = defineProps<{ layout: LetterLayout; body: string; ready: boolean; attachmentOnly?: boolean; designer?: boolean }>()
const showAttachments = ref(false)
const mounted = ref(false)
const container = useTemplateRef<HTMLElement>('canvas')
const fit = ref(.75)
const zoom = ref(1)
const scale = computed(() => fit.value * zoom.value)
let observer: ResizeObserver | undefined
onMounted(async () => {
  await document.fonts.ready
  mounted.value = true
  observer = new ResizeObserver(entries => { fit.value = Math.min(1, Math.max(.2, (entries[0]!.contentRect.width - 48) / (210 * 96 / 25.4))) })
  if (container.value) observer.observe(container.value)
})
onBeforeUnmount(() => observer?.disconnect())
const measurements = computed(() => {
  // Canvas only measures text; all output remains escaped Vue text nodes.
  const context = mounted.value ? document.createElement('canvas').getContext('2d') : null
  const pxPerMm = 96 / 25.4
  const measure = (text: string, format: TextBlockFormat) => {
    if (!context) return text.length * 7.2 / pxPerMm
    context.font = `${format.italic ? 'italic' : 'normal'} ${format.bold ? 'bold' : 'normal'} 11pt "Nitoh Letter"`
    return context.measureText(text).width / pxPerMm
  }
  const regular = defaultFormat()
  const plain = (text: string) => measure(text, regular)
  const annexes = attachmentPages(props.layout.attachments ?? [], plain, 165, measure)
  const formats = props.layout.sectionFormats
  const body = formatBody(props.body, props.layout.bodyFormats, measure)
  const salutation = formatLines(props.layout.salutation, formats?.salutation, measure)
  const closingText = props.layout.closingText?.trim() ? formatLines(props.layout.closingText, formats?.closingText, measure) : []
  const closing = formatLines(props.layout.closing, formats?.closing, measure)
  const signature = formatLines(props.layout.signature, formats?.signature, measure)
  const subject = formatLines(props.layout.subject, formats?.subject, measure, true)
  const firstCapacity = Math.max(10, 31 - subject.length - salutation.length - 3)
  return { annexes, subject, salutation, closingText, closing, signature, pages: props.attachmentOnly ? [] : paginateLines(body, firstCapacity, 43, closingText.length + (closingText.length ? 1 : 0) + closing.length + signature.length + 4 + (props.layout.signatureImage ? Math.ceil((imageGeometry(props.layout.signatureImage, 'signature').height + imageGeometry(props.layout.signatureImage, 'signature').y) / lineHeightMm) : 0)) }
})
const total = computed(() => measurements.value.pages.length + measurements.value.annexes.length)
const pageHeight = 297 * 96 / 25.4
function print(): string | null {
  if (total.value > 50) return 'Der Brief mit Anlagen überschreitet 50 Seiten.'
  const required = [props.layout.senderName, props.layout.senderStreet, props.layout.senderPostalCode, props.layout.senderCity, props.layout.recipientName, props.layout.recipientStreet, props.layout.recipientPostalCode, props.layout.recipientCity, props.layout.subject, props.layout.salutation, props.layout.date]
  if (required.some(value => !value.trim())) return 'Bitte vervollständige Absender, Empfänger, Betreff, Anrede und Datum vor dem Drucken.'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(props.layout.date)) return 'Bitte wähle ein gültiges Briefdatum.'
  for (const sheet of container.value?.querySelectorAll<HTMLElement>('.letter-page:not(.attachment-page)') || []) {
    const writing = sheet.querySelector<HTMLElement>('.letter-writing')!
    const footer = sheet.querySelector<HTMLElement>('.letter-footer')!
    if (writing.getBoundingClientRect().bottom > footer.getBoundingClientRect().top - 5) return 'Der Brieftext passt nicht in den Druckbereich. Bitte kürze die Angaben oder füge Absätze ein.'
    const address = sheet.querySelector<HTMLElement>('.letter-address')
    const recipient = sheet.querySelector<HTMLElement>('.recipient')
    if (address && recipient && recipient.getBoundingClientRect().bottom > address.getBoundingClientRect().bottom) return 'Die Empfängeranschrift ist zu lang für das Anschriftfeld. Bitte kürze sie.'
    const returned = sheet.querySelector<HTMLElement>('.return-address')
    if (returned && returned.scrollHeight > returned.clientHeight + 1) return 'Die Rücksendeangabe ist zu lang. Bitte kürze die Absenderangaben.'
    const info = sheet.querySelector<HTMLElement>('.letter-info')
    if (info && address && info.getBoundingClientRect().bottom > address.getBoundingClientRect().bottom) return 'Der Informationsblock ist zu lang. Bitte kürze Referenz oder Kontaktdaten.'
    const sender = sheet.querySelector<HTMLElement>('.letter-sender')
    const header = sheet.querySelector<HTMLElement>('.letter-head')
    if (sender && header && sender.getBoundingClientRect().bottom > header.getBoundingClientRect().bottom) return 'Der Briefkopf ist zu lang. Bitte kürze die Absenderangaben.'
  }
  window.print()
  return null
}
defineExpose({ print })
</script>
<template>
  <section class="preview-panel" :aria-label="attachmentOnly ? 'Formularvorschau' : 'Briefvorschau'">
    <div class="preview-toolbar no-print"><div><span class="preview-dot" /><strong>Live-Vorschau</strong><span class="preview-tag">A4</span></div><button v-if="measurements.annexes.length && !attachmentOnly" class="button subtle" :aria-expanded="showAttachments" @click="showAttachments = !showAttachments">{{ showAttachments ? 'Anlagen ausblenden' : `Anlagen anzeigen (${layout.attachments?.length})` }}</button><slot name="tools" /><div v-if="designer" class="preview-zoom"><button class="button subtle" :disabled="zoom <= 0.75" aria-label="Vorschau verkleinern" @click="zoom -= .25">−</button><button class="button subtle" aria-label="Vorschau einpassen" @click="zoom = 1">{{ Math.round(scale * 100) }} %</button><button class="button subtle" :disabled="zoom >= 2" aria-label="Vorschau vergrößern" @click="zoom += .25">＋</button></div><span v-else>{{ total }} {{ total === 1 ? 'Seite' : 'Seiten' }} · {{ Math.round(scale * 100) }} %</span></div>
    <div ref="canvas" class="preview-canvas">
      <div v-for="(page,index) in measurements.pages" :key="index" class="page-frame" :style="{ height: `${pageHeight * scale}px`, width: `${210 * 96 / 25.4 * scale}px` }"><div class="page-scale" :style="{ transform: `scale(${scale})` }"><LetterPage :layout="layout" :page="page" :number="index + 1" :total="total" :subject-lines="measurements.subject" :salutation-lines="measurements.salutation" :closing-lines="measurements.closing" :closing-text-lines="measurements.closingText" :signature-lines="measurements.signature" :designer="designer" /></div></div>
      <div v-for="(page,index) in measurements.annexes" :key="`attachment-${index}`" class="page-frame" :class="{ 'attachment-collapsed': !showAttachments && !attachmentOnly }" :style="{ height: `${pageHeight * scale}px`, width: `${210 * 96 / 25.4 * scale}px` }">
        <div class="page-scale" :style="{ transform: `scale(${scale})` }">
          <article class="letter-page attachment-page" :aria-label="`Anlage ${page.number}`">
            <div class="attachment-heading">Anlage {{ page.number }}{{ page.continued ? ' · Fortsetzung' : '' }}</div>
            <h2><span v-for="(line, lineIndex) in page.title" :key="lineIndex">{{ line }}</span></h2>
            <LetterPlacedImage v-if="page.image" :image="page.image" role="attachment" label="Formularbild" :designer="designer" />
            <LetterFormattedLines :lines="page.lines" />
            <footer>{{ measurements.pages.length + index + 1 }} / {{ total }}</footer>
          </article>
        </div>
      </div>
    </div>
    <div v-if="!attachmentOnly" class="preview-caption no-print"><span>↳ Layout orientiert an DIN 5008 · Form B</span><span>{{ ready ? 'Brief fertiggestellt' : 'Entwurf' }}</span></div>
  </section>
</template>
