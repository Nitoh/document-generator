<script setup lang="ts">
import type { LetterLayout, LetterPageData } from '~/types/document'
import type { FormattedLine } from '~/utils/letter-format'
import type { PreviewBlock } from '~/utils/editor-links'
import { formatDate } from '~/utils/letter'
const props = defineProps<{ layout: LetterLayout; page: LetterPageData<FormattedLine>; number: number; total: number; subjectLines: FormattedLine[]; salutationLines: FormattedLine[]; closingTextLines: FormattedLine[]; closingLines: FormattedLine[]; signatureLines: FormattedLine[]; designer?: boolean; linked?: boolean }>()
const emit = defineEmits<{ select: [PreviewBlock] }>()
const groups = computed(() => {
  const groups: { block?: number; lines: FormattedLine[] }[] = []
  for (const line of props.page.lines) {
    const previous = groups.at(-1)
    if (previous && previous.block === line.block) previous.lines.push(line)
    else groups.push({ block: line.block, lines: [line] })
  }
  return groups
})
</script>
<template>
  <article class="letter-page" :data-design="layout.design" :data-header="layout.headerStyle" :class="{ continuation: !page.first }" :aria-label="`Briefseite ${number} von ${total}`">
    <template v-if="page.first">
      <LetterPreviewTarget v-if="layout.showHeader !== false" as="header" class="letter-head" :enabled="linked" label="Briefkopf" @select="emit('select', 'header')"><div class="letter-sender"><strong>{{ layout.senderName }}</strong><span>{{ layout.senderStreet }}</span><span>{{ layout.senderPostalCode }} {{ layout.senderCity }}</span></div><LetterPlacedImage v-if="layout.logoImage" :image="layout.logoImage" role="logo" label="Logo" :designer="designer" /><BrandNitohMark v-else-if="layout.showLogo" decorative /></LetterPreviewTarget>
      <LetterPreviewTarget class="letter-address" :enabled="linked" label="Empfängeranschrift" @select="emit('select', 'recipient')"><div class="return-address">{{ [layout.senderName, layout.senderStreet, `${layout.senderPostalCode} ${layout.senderCity}`].filter(x => x.trim()).join(' · ') }}</div><div class="recipient"><span>{{ layout.recipientName }}</span><span>{{ layout.recipientStreet }}</span><span>{{ layout.recipientPostalCode }} {{ layout.recipientCity }}</span></div></LetterPreviewTarget>
      <LetterPreviewTarget v-if="layout.showInformation !== false" class="letter-info" :style="{ textAlign: layout.informationAlign ?? 'left' }" :enabled="linked" label="Informationsblock" @select="emit('select', 'information')"><span v-if="layout.reference"><small>Unser Zeichen</small>{{ layout.reference }}</span><span v-if="layout.senderPhone"><small>Telefon</small>{{ layout.senderPhone }}</span><span v-if="layout.senderEmail"><small>E-Mail</small>{{ layout.senderEmail }}</span><span><small>Datum</small>{{ layout.city ? `${layout.city}, ` : '' }}{{ formatDate(layout.date) }}</span></LetterPreviewTarget>
    </template>
    <div v-else class="continuation-head"><strong>{{ layout.senderName }}</strong><span v-if="layout.showInformation !== false">{{ formatDate(layout.date) }} · {{ layout.reference }}</span></div>
    <section class="letter-writing">
      <template v-if="page.first">
        <LetterPreviewTarget as="h2" class="letter-subject" :enabled="linked" label="Betreff" @select="emit('select', 'subject')"><LetterFormattedLines :lines="subjectLines" /></LetterPreviewTarget>
        <LetterPreviewTarget as="p" class="letter-salutation" :enabled="linked" label="Anrede" @select="emit('select', 'salutation')"><LetterFormattedLines :lines="salutationLines" /></LetterPreviewTarget>
      </template>
      <div class="letter-body">
        <LetterPreviewTarget v-for="(group, index) in groups" :key="index" :enabled="linked && group.block !== undefined"
          :label="`Textbaustein ${(group.block ?? 0) + 1}`" @select="emit('select', `body:${group.block ?? 0}`)">
          <LetterFormattedLines :lines="group.lines" />
        </LetterPreviewTarget>
      </div>
      <div v-if="page.last" class="letter-closing">
        <LetterPreviewTarget as="p" v-if="closingTextLines.length" class="letter-closing-text" :enabled="linked" label="Abschlussabsatz" @select="emit('select', 'closingText')"><LetterFormattedLines :lines="closingTextLines" /></LetterPreviewTarget>
        <LetterPreviewTarget as="p" :enabled="linked" label="Grußformel" @select="emit('select', 'closing')"><LetterFormattedLines :lines="closingLines" /></LetterPreviewTarget>
        <LetterPlacedImage v-if="layout.signatureImage" :image="layout.signatureImage" role="signature" label="Unterschrift" :designer="designer" />
        <LetterPreviewTarget as="p" class="letter-signature" :enabled="linked" label="Unterschrift" @select="emit('select', 'signature')"><LetterFormattedLines :lines="signatureLines" /></LetterPreviewTarget>
      </div>
    </section>
    <template v-if="layout.showFoldMarks"><i class="fold-mark fold-one" /><i class="fold-mark fold-two" /><i class="fold-mark punch" /></template>
    <LetterPreviewTarget as="footer" class="letter-footer" :enabled="linked" label="Fußzeile" @select="emit('select', 'footer')"><span>{{ layout.footer }}</span><span>{{ number }} / {{ total }}</span></LetterPreviewTarget>
  </article>
</template>
