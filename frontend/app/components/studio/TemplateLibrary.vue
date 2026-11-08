<script setup lang="ts">
import type { DocumentTemplate } from '~/types/document'
import { starterTemplates } from '~/data/template-presets'
const props = defineProps<{ templates: DocumentTemplate[]; loading: boolean; busy: boolean; localMode: boolean }>()
defineEmits<{ close: []; choose: [item: DocumentTemplate]; remove: [item: DocumentTemplate]; refresh: []; create: [] }>()
const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const search = ref('')
const category = ref('')
const scope = ref('all')
const starters = starterTemplates()
const all = computed(() => [...props.templates.map(item => ({ ...item, category: item.category?.trim() || 'Allgemeines' })), ...starters])
const scoped = computed(() => all.value.filter(item => scope.value === 'all' || (scope.value === 'starter') === item.id.startsWith('starter:')))
const categoryNames = computed(() => [...new Map(all.value.map(item => [item.category.toLocaleLowerCase('de'), item.category])).values()].sort((a,b) => a.localeCompare(b,'de')))
const filtered = computed(() => scoped.value.filter(item => (!category.value || item.category.toLocaleLowerCase('de') === category.value.toLocaleLowerCase('de')) && `${item.name} ${item.category}`.toLocaleLowerCase('de').includes(search.value.toLocaleLowerCase('de'))))
onMounted(() => dialog.value?.showModal())
</script>
<template>
  <dialog ref="dialog" class="library-dialog template-archive no-print" aria-labelledby="library-title" @close="$emit('close')">
    <div class="dialog-heading"><div><span class="eyebrow">DEINE BRIEFVORLAGEN</span><h2 id="library-title">Einmal bauen. Immer nutzen.</h2></div><button class="icon-button" aria-label="Vorlagen schließen" @click="$emit('close')">×</button></div>
    <p class="muted">{{ localMode ? 'Eigene Vorlagen werden auf diesem Gerät gespeichert.' : 'Eigene Vorlagen werden in PostgreSQL gespeichert.' }} Layouts sind unabhängig vom Briefinhalt.</p>
    <div class="archive-tools"><UiFormField id="template-search" v-model="search" label="Vorlagen suchen" /><button class="button dark" :disabled="busy" @click="$emit('create')">＋ Neue Briefvorlage</button></div>
    <div class="archive-scopes" aria-label="Vorlagenquelle"><button v-for="item in [{id:'all',label:'Alle'}, {id:'saved',label:'Meine Vorlagen'}, {id:'starter',label:'Startvorlagen'}]" :key="item.id" :aria-pressed="scope === item.id" @click="scope = item.id">{{ item.label }}</button></div>
    <div class="category-suggestions category-filter" aria-label="Kategorien"><button :aria-pressed="!category" @click="category = ''">Alle Kategorien</button><button v-for="name in categoryNames" :key="name" :aria-pressed="category === name" @click="category = name">{{ name }}</button></div>
    <p v-if="loading" role="status">Eigene Vorlagen werden geladen …</p>
    <div v-if="!filtered.length" class="empty-library"><span>▤</span><h3>Keine passende Vorlage.</h3><p>Ändere die Filter oder baue eine eigene Briefvorlage.</p></div>
    <ul v-else class="library-list"><li v-for="item in filtered" :key="item.id"><button :disabled="busy" @click="$emit('choose',item)"><span class="file-symbol">▤</span><span><strong>{{ item.name }}</strong><small>{{ item.category }} · {{ item.id.startsWith('starter:') ? 'Bearbeitbare Startvorlage' : new Date(item.createdAt).toLocaleDateString('de-DE') }}</small></span><span>↗</span></button><button v-if="!item.id.startsWith('starter:')" class="icon-button" :disabled="busy" :aria-label="`Vorlage ${item.name} löschen`" @click="$emit('remove',item)">×</button></li></ul>
    <button class="button subtle" :disabled="loading" @click="$emit('refresh')">Eigene Vorlagen neu laden</button>
  </dialog>
</template>
