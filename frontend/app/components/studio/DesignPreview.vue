<script setup lang="ts">
import type { PreviewBlock } from '~/utils/editor-links'
import type { LetterDraft } from '~/types/document'
import { layoutFields, previewLayout, previewText, templateFields } from '~/utils/template'
const props = defineProps<{ draft: LetterDraft }>()
const emit = defineEmits<{ select: [PreviewBlock] }>()
const sample = ref(false)
const examples: Record<string, string> = {
  Name: 'Alex Berger', Nachname: 'Berger', Vertragsnummer: 'V-2026-015', Kündigungsdatum: '31.12.2026', Datum: '15.11.2026'
}
const values = computed(() => Object.fromEntries([...new Set([
  ...templateFields(props.draft.content), ...layoutFields(props.draft.layout)
])].map(field => [field, examples[field] ?? `Beispiel für ${field}`])))
</script>
<template>
  <LetterPreview
    :layout="sample ? previewLayout(draft.layout, values) : draft.layout"
    :body="sample ? previewText(draft.content, values) : draft.content"
    :ready="false" designer linked @select="emit('select', $event)">
    <template #tools><button class="button subtle sample-preview" :aria-pressed="sample" @click="sample = !sample">{{ sample ? 'Platzhalter zeigen' : 'Beispieldaten zeigen' }}</button></template>
  </LetterPreview>
</template>
