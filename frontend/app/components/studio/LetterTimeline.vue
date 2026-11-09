<script setup lang="ts">
import { lettersByMonth, type LetterRecord } from '~/utils/studio-archive'
const props = defineProps<{ letters: LetterRecord[]; archived: boolean }>()
defineEmits<{ open: [LetterRecord] }>()
const groups = computed(() => lettersByMonth(props.letters))
const timestamp = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'medium' })
function subject(item: LetterRecord) { return 'parts' in item ? item.subject : item.layout.subject }
function recipient(item: LetterRecord) { return 'parts' in item ? item.recipient : item.layout.recipientName }
</script>
<template>
  <div class="letter-timeline no-print">
    <p v-if="!groups.length" class="muted">{{ archived ? 'Das Archiv ist noch leer.' : 'In diesem Zeitraum sind keine Briefe gespeichert.' }}</p>
    <section v-for="group in groups" :key="group.label" class="timeline-month">
      <h2>{{ group.label }}</h2>
      <ul>
        <li v-for="letter in group.entries" :key="letter.id">
          <button class="timeline-letter" type="button" @click="$emit('open', letter)">
            <svg class="timeline-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l4 4v14H7zM14 3v5h4M10 12h5m-5 4h5" /></svg>
            <span class="timeline-copy">
              <strong>{{ subject(letter) }}</strong>
              <span>{{ recipient(letter) }}<template v-if="letter.origin"> · {{ letter.origin.name }}<template v-if="letter.origin.version"> · Version {{ letter.origin.version }}</template></template></span>
            </span>
            <time :datetime="letter.at">{{ timestamp.format(new Date(letter.at)) }}</time>
            <span class="timeline-arrow" aria-hidden="true">↗</span>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>
