<script setup lang="ts">
import type { LetterAttachment } from '~/types/document'
import { validateTemplate } from '~/utils/template'
const props = defineProps<{ library: LetterAttachment[]; defaults: LetterAttachment[]; extras: LetterAttachment[]; saveItem: (item: LetterAttachment) => void }>()
const emit = defineEmits<{ close: []; toggle: [item: LetterAttachment] }>()
const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const form = ref<LetterAttachment | null>(null)
const error = ref('')
const feedback = ref('')
function create() { edit({ id: crypto.randomUUID(), title: '', content: '' }) }
function edit(item: LetterAttachment) { form.value = { ...item }; error.value = ''; feedback.value = '' }
function save() {
  if (!form.value) return
  try {
    validateTemplate(form.value.title)
    validateTemplate(form.value.content)
    props.saveItem({ ...form.value, title: form.value.title.trim() })
    form.value = null
    feedback.value = 'Formular in der Bibliothek gespeichert.'
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Formular konnte nicht gespeichert werden.' }
}
function toggle(item: LetterAttachment) {
  if (!props.extras.some(extra => extra.id === item.id) && props.defaults.length + props.extras.length >= 5) {
    error.value = 'Ein Brief kann bis zu fünf Anlagen enthalten.'
    return
  }
  error.value = ''
  emit('toggle', item)
}
onMounted(() => dialog.value?.showModal())
</script>

<template>
  <dialog ref="dialog" class="library-dialog builder-dialog no-print" aria-labelledby="attachments-title" @close="emit('close')">
    <div class="dialog-heading"><h2 id="attachments-title">Formularanhänge</h2><button class="icon-button" aria-label="Formularanhänge schließen" @click="emit('close')">×</button></div>
    <p class="muted">Formulare werden auf diesem Gerät gespeichert. Im Designer kannst du eine Kopie fest in eine Vorlage übernehmen.</p>
    <button class="button dark" @click="create">Neues Formular</button>
    <form v-if="form" class="designer-block" @submit.prevent="save">
      <UiFormField id="attachment-title" v-model="form.title" label="Titel des Formulars" />
      <UiFormField id="attachment-content" v-model="form.content" label="Formulartext" multiline :rows="6" :maxlength="20000" hint="Doppelklammern wie {{Vertragsnummer}} erzeugen ausfüllbare Felder im Briefeditor." />
      <div class="document-actions"><button type="button" class="button subtle" @click="form.content += '\nFeldbezeichnung: {{Feldname}}'">Formularfeld einfügen</button><button class="button dark" type="submit">Formular speichern</button></div>
    </form>
    <p v-if="feedback" role="status">{{ feedback }}</p>
    <p v-if="error" role="alert" class="studio-feedback error">{{ error }}</p>
    <ul class="library-list">
      <li v-for="item in library" :key="item.id" class="attachment-row">
        <span><strong>{{ item.title }}</strong><small v-if="defaults.some(fixed => fixed.id === item.id)">Fest in der Vorlage</small></span>
        <div class="document-actions">
          <button class="button subtle" @click="edit(item)">Bearbeiten</button>
          <button v-if="!defaults.some(fixed => fixed.id === item.id)" class="button subtle" @click="toggle(item)">{{ extras.some(extra => extra.id === item.id) ? 'Vom Brief entfernen' : 'An diesen Brief anhängen' }}</button>
        </div>
      </li>
    </ul>
  </dialog>
</template>
