<script setup lang="ts">
import type { DocumentTemplate } from '~/types/document'
defineProps<{ templates: DocumentTemplate[]; loading: boolean; busy: boolean; localMode: boolean }>()
defineEmits<{ close: []; choose: [item: DocumentTemplate]; remove: [item: DocumentTemplate]; refresh: [] }>()
const dialog = useTemplateRef<HTMLDialogElement>('dialog')
onMounted(() => dialog.value?.showModal())
</script>
<template>
  <dialog ref="dialog" class="library-dialog no-print" aria-labelledby="library-title" @close="$emit('close')" @click="($event.target === dialog) && $emit('close')">
    <div class="dialog-heading"><div><span class="eyebrow">DEIN ARCHIV</span><h2 id="library-title">Meine Vorlagen.</h2></div><button class="icon-button" aria-label="Vorlagen schließen" @click="$emit('close')">×</button></div>
    <p class="muted">{{ localMode ? 'Auf diesem Gerät gespeichert.' : 'In deiner PostgreSQL-Datenbank gespeichert.' }}</p>
    <p v-if="loading" role="status">Vorlagen werden geladen …</p>
    <div v-else-if="!templates.length" class="empty-library"><span>▤</span><h3>Raum für deine Ideen.</h3><p>Speichere deinen ersten Brief als Vorlage und nutze ihn immer wieder.</p></div>
    <ul v-else class="library-list"><li v-for="item in templates" :key="item.id"><button :disabled="busy" @click="$emit('choose',item)"><span class="file-symbol">▤</span><span><strong>{{ item.name }}</strong><small>{{ new Date(item.createdAt).toLocaleDateString('de-DE') }}</small></span><span>↗</span></button><button class="icon-button" :disabled="busy" :aria-label="`Vorlage ${item.name} löschen`" @click="$emit('remove',item)">×</button></li></ul>
    <button class="button subtle" :disabled="loading" @click="$emit('refresh')">Vorlagen neu laden</button>
  </dialog>
</template>
