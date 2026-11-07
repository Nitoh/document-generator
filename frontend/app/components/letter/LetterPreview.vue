<script setup lang="ts">
import type { LetterLayout } from '~/types/document'
import { paginateLines, wrapText } from '~/utils/letter'
const props = defineProps<{ layout: LetterLayout; body: string; ready: boolean }>()
const mounted = ref(false)
const container = useTemplateRef<HTMLElement>('canvas')
const scale = ref(.75)
let observer: ResizeObserver | undefined
onMounted(async () => {
  await document.fonts.ready
  mounted.value = true
  observer = new ResizeObserver(entries => { scale.value = Math.min(1, Math.max(.2, (entries[0]!.contentRect.width - 48) / (210 * 96 / 25.4))) })
  if (container.value) observer.observe(container.value)
})
onBeforeUnmount(() => observer?.disconnect())
const measurements = computed(() => {
  // Canvas only measures text; all output remains escaped Vue text nodes.
  const context = mounted.value ? document.createElement('canvas').getContext('2d') : null
  const measure = (text: string) => context ? context.measureText(text).width : text.length * 7.2
  if (context) context.font = '11pt "Nitoh Letter"'
  const width = 165 * 96 / 25.4
  const body = wrapText(props.body, measure, width)
  const salutation = wrapText(props.layout.salutation, measure, width)
  const closing = wrapText(props.layout.closing, measure, width)
  const signature = wrapText(props.layout.signature, measure, width)
  if (context) context.font = 'bold 11pt "Nitoh Letter"'
  const subject = wrapText(props.layout.subject, measure, width)
  const firstCapacity = Math.max(10, 31 - subject.length - salutation.length - 3)
  return { subject, salutation, closing, signature, pages: paginateLines(body, firstCapacity, 43, closing.length + signature.length + 4) }
})
const pageHeight = 297 * 96 / 25.4
function print(): string | null {
  const required = [props.layout.senderName, props.layout.senderStreet, props.layout.senderPostalCode, props.layout.senderCity, props.layout.recipientName, props.layout.recipientStreet, props.layout.recipientPostalCode, props.layout.recipientCity, props.layout.subject, props.layout.salutation, props.layout.date]
  if (required.some(value => !value.trim())) return 'Bitte vervollständige Absender, Empfänger, Betreff, Anrede und Datum vor dem Drucken.'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(props.layout.date)) return 'Bitte wähle ein gültiges Briefdatum.'
  for (const sheet of container.value?.querySelectorAll<HTMLElement>('.letter-page') || []) {
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
  <section class="preview-panel" aria-label="Briefvorschau">
    <div class="preview-toolbar no-print"><div><span class="preview-dot" /><strong>Live-Vorschau</strong><span class="preview-tag">A4</span></div><span>{{ measurements.pages.length }} {{ measurements.pages.length === 1 ? 'Seite' : 'Seiten' }} · {{ Math.round(scale * 100) }} %</span></div>
    <div ref="canvas" class="preview-canvas">
      <div v-for="(page,index) in measurements.pages" :key="index" class="page-frame" :style="{ height: `${pageHeight * scale}px`, width: `${210 * 96 / 25.4 * scale}px` }"><div class="page-scale" :style="{ transform: `scale(${scale})` }"><LetterPage :layout="layout" :page="page" :number="index + 1" :total="measurements.pages.length" :subject-lines="measurements.subject" :salutation-lines="measurements.salutation" :closing-lines="measurements.closing" :signature-lines="measurements.signature" /></div></div>
    </div>
    <div class="preview-caption no-print"><span>↳ Layout orientiert an DIN 5008 · Form B</span><span>{{ ready ? 'Brief fertiggestellt' : 'Entwurf' }}</span></div>
  </section>
</template>
