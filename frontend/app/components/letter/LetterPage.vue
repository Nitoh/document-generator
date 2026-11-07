<script setup lang="ts">
import type { LetterLayout, LetterPageData } from '~/types/document'
import { formatDate } from '~/utils/letter'
defineProps<{ layout: LetterLayout; page: LetterPageData; number: number; total: number; subjectLines: string[]; salutationLines: string[]; closingLines: string[]; signatureLines: string[] }>()
</script>
<template>
  <article class="letter-page" :class="{ continuation: !page.first }" :aria-label="`Briefseite ${number} von ${total}`">
    <template v-if="page.first">
      <header class="letter-head"><div class="letter-sender"><strong>{{ layout.senderName }}</strong><span>{{ layout.senderStreet }}</span><span>{{ layout.senderPostalCode }} {{ layout.senderCity }}</span></div><BrandNitohMark v-if="layout.showLogo" decorative /></header>
      <div class="letter-address"><div class="return-address">{{ [layout.senderName, layout.senderStreet, `${layout.senderPostalCode} ${layout.senderCity}`].filter(x => x.trim()).join(' · ') }}</div><div class="recipient"><span>{{ layout.recipientName }}</span><span>{{ layout.recipientStreet }}</span><span>{{ layout.recipientPostalCode }} {{ layout.recipientCity }}</span></div></div>
      <div class="letter-info"><span v-if="layout.reference"><small>Unser Zeichen</small>{{ layout.reference }}</span><span v-if="layout.senderPhone"><small>Telefon</small>{{ layout.senderPhone }}</span><span v-if="layout.senderEmail"><small>E-Mail</small>{{ layout.senderEmail }}</span><span><small>Datum</small>{{ layout.city ? `${layout.city}, ` : '' }}{{ formatDate(layout.date) }}</span></div>
    </template>
    <div v-else class="continuation-head"><strong>{{ layout.senderName }}</strong><span>{{ formatDate(layout.date) }} · {{ layout.reference }}</span></div>
    <section class="letter-writing">
      <template v-if="page.first"><h2 class="letter-subject"><span v-for="(line,index) in subjectLines" :key="index">{{ line || ' ' }}</span></h2><p class="letter-salutation"><span v-for="(line,index) in salutationLines" :key="index">{{ line || ' ' }}</span></p></template>
      <div class="letter-body"><div v-for="(line,index) in page.lines" :key="index" class="text-line">{{ line || ' ' }}</div></div>
      <div v-if="page.last" class="letter-closing"><p><span v-for="(line,index) in closingLines" :key="index">{{ line || ' ' }}</span></p><p class="letter-signature"><span v-for="(line,index) in signatureLines" :key="index">{{ line || ' ' }}</span></p></div>
    </section>
    <template v-if="layout.showFoldMarks"><i class="fold-mark fold-one" /><i class="fold-mark fold-two" /><i class="fold-mark punch" /></template>
    <footer class="letter-footer"><span>{{ layout.footer }}</span><span>{{ number }} / {{ total }}</span></footer>
  </article>
</template>
