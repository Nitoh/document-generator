<script setup lang="ts">
import type { LetterLayout, LetterPageData } from '~/types/document'
import type { FormattedLine } from '~/utils/letter-format'
import { formatDate } from '~/utils/letter'
defineProps<{ layout: LetterLayout; page: LetterPageData<FormattedLine>; number: number; total: number; subjectLines: FormattedLine[]; salutationLines: FormattedLine[]; closingTextLines: FormattedLine[]; closingLines: FormattedLine[]; signatureLines: FormattedLine[]; designer?: boolean }>()
</script>
<template>
  <article class="letter-page" :data-design="layout.design" :data-header="layout.headerStyle" :class="{ continuation: !page.first }" :aria-label="`Briefseite ${number} von ${total}`">
    <template v-if="page.first">
      <header class="letter-head"><div class="letter-sender"><strong>{{ layout.senderName }}</strong><span>{{ layout.senderStreet }}</span><span>{{ layout.senderPostalCode }} {{ layout.senderCity }}</span></div><LetterPlacedImage v-if="layout.logoImage" :image="layout.logoImage" role="logo" label="Logo" :designer="designer" /><BrandNitohMark v-else-if="layout.showLogo" decorative /></header>
      <div class="letter-address"><div class="return-address">{{ [layout.senderName, layout.senderStreet, `${layout.senderPostalCode} ${layout.senderCity}`].filter(x => x.trim()).join(' · ') }}</div><div class="recipient"><span>{{ layout.recipientName }}</span><span>{{ layout.recipientStreet }}</span><span>{{ layout.recipientPostalCode }} {{ layout.recipientCity }}</span></div></div>
      <div class="letter-info"><span v-if="layout.reference"><small>Unser Zeichen</small>{{ layout.reference }}</span><span v-if="layout.senderPhone"><small>Telefon</small>{{ layout.senderPhone }}</span><span v-if="layout.senderEmail"><small>E-Mail</small>{{ layout.senderEmail }}</span><span><small>Datum</small>{{ layout.city ? `${layout.city}, ` : '' }}{{ formatDate(layout.date) }}</span></div>
    </template>
    <div v-else class="continuation-head"><strong>{{ layout.senderName }}</strong><span>{{ formatDate(layout.date) }} · {{ layout.reference }}</span></div>
    <section class="letter-writing">
      <template v-if="page.first">
        <h2 class="letter-subject"><LetterFormattedLines :lines="subjectLines" /></h2>
        <p class="letter-salutation"><LetterFormattedLines :lines="salutationLines" /></p>
      </template>
      <div class="letter-body"><LetterFormattedLines :lines="page.lines" /></div>
      <div v-if="page.last" class="letter-closing">
        <p v-if="closingTextLines.length" class="letter-closing-text"><LetterFormattedLines :lines="closingTextLines" /></p>
        <p><LetterFormattedLines :lines="closingLines" /></p>
        <LetterPlacedImage v-if="layout.signatureImage" :image="layout.signatureImage" role="signature" label="Unterschrift" :designer="designer" />
        <p class="letter-signature"><LetterFormattedLines :lines="signatureLines" /></p>
      </div>
    </section>
    <template v-if="layout.showFoldMarks"><i class="fold-mark fold-one" /><i class="fold-mark fold-two" /><i class="fold-mark punch" /></template>
    <footer class="letter-footer"><span>{{ layout.footer }}</span><span>{{ number }} / {{ total }}</span></footer>
  </article>
</template>
