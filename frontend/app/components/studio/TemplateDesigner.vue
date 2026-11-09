<script setup lang="ts">
import type { LetterAttachment } from '~/types/document'
const props = defineProps<{ content: string; attachments: LetterAttachment[]; library: LetterAttachment[] }>()
const emit = defineEmits<{ close: []; apply: [content: string, attachments: LetterAttachment[]] }>()
const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const original = props.content.split(/\r?\n[ \t]*\r?\n/)
const blocks = ref(original.map(text => ({ id: crypto.randomUUID(), text })))
const selected = ref(props.attachments.map(item => item.id))
const available = computed(() => [...props.attachments, ...props.library]
  .filter((item, index, all) => all.findIndex(other => other.id === item.id) === index))
const preset = ref('Rückfrage')
const error = ref('')
const snippets: Record<string, string> = {
  Rückfrage: 'Bei Fragen stehe ich Ihnen gerne zur Verfügung.',
  Rückmeldung: 'Bitte geben Sie mir bis zum {{Rückmeldefrist}} eine Rückmeldung.',
  Bezug: 'Ich beziehe mich auf {{Vorgang}} vom {{Datum}}.',
  'Eigener Baustein': ''
}
function addBlock() { blocks.value.push({ id: crypto.randomUUID(), text: snippets[preset.value] ?? '' }) }
function move(index: number, direction: number) {
  const item = blocks.value.splice(index, 1)[0]!
  blocks.value.splice(index + direction, 0, item)
}
function apply() {
  const unchanged = blocks.value.length === original.length && blocks.value.every((block, index) => block.text === original[index])
  const content = unchanged ? props.content : blocks.value.map(block => block.text).filter(text => text.trim()).join('\n\n')
  if (!content.trim() || content.length > 20000) { error.value = 'Der Brieftext muss zwischen 1 und 20.000 Zeichen lang sein.'; return }
  if (selected.value.length > 5) { error.value = 'Wähle bis zu fünf feste Anlagen.'; return }
  emit('apply', content, selected.value.map(id => available.value.find(item => item.id === id)!))
}
onMounted(() => dialog.value?.showModal())
</script>

<template>
  <dialog ref="dialog" class="library-dialog builder-dialog no-print" aria-labelledby="designer-title" @close="emit('close')">
    <div class="dialog-heading"><h2 id="designer-title">Vorlagendesigner</h2><button class="icon-button" aria-label="Designer schließen" @click="emit('close')">×</button></div>
    <p class="muted">Stelle den Brief aus Textbausteinen zusammen. Die Reihenfolge bestimmt den Brieftext.</p>
    <div class="archive-tools"><div class="form-field"><label for="snippet">Textbaustein</label><select id="snippet" v-model="preset"><option v-for="(_, name) in snippets" :key="name">{{ name }}</option></select></div><button class="button subtle" @click="addBlock">Baustein hinzufügen</button></div>
    <div v-for="(block, index) in blocks" :key="block.id" class="designer-block">
      <UiFormField :id="`block-${block.id}`" v-model="block.text" :label="`Baustein ${index + 1}`" multiline :rows="3" :maxlength="20000" />
      <div class="document-actions">
        <button class="button subtle" :disabled="index === 0" :aria-label="`Baustein ${index + 1} nach oben`" @click="move(index, -1)">↑</button>
        <button class="button subtle" :disabled="index === blocks.length - 1" :aria-label="`Baustein ${index + 1} nach unten`" @click="move(index, 1)">↓</button>
        <button class="button subtle" @click="blocks.splice(index, 1)">Entfernen</button>
      </div>
    </div>
    <fieldset class="appearance-picker">
      <legend>Feste Anlagen dieser Vorlage</legend>
      <p v-if="!available.length" class="muted">Lege zuerst ein Formular unter „Formularanhänge“ an.</p>
      <label v-for="item in available" :key="item.id" class="attachment-option"><input v-model="selected" type="checkbox" :value="item.id"> {{ item.title }}</label>
    </fieldset>
    <p v-if="error" role="alert" class="studio-feedback error">{{ error }}</p>
    <div class="builder-actions"><button class="button subtle" @click="emit('close')">Abbrechen</button><button class="button dark" @click="apply">In Entwurf übernehmen</button></div>
  </dialog>
</template>
