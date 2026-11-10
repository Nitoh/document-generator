<script setup lang="ts">
import type { Version } from '~/utils/studio-archive'
const props = defineProps<{ versions: Version[] }>()
const theme = defineModel<'light' | 'dark'>('theme', { required: true })
const emit = defineEmits<{ openVersion: [Version] }>()
const search = ref('')
const groups = computed(() => {
  const groups = new Map<string, { label: string; kind: string; versions: Version[] }>()
  for (const version of props.versions) {
    const key = `${version.kind}:${version.item.id}`
    const label = version.kind === 'template' ? version.item.name : version.item.title
    const group = groups.get(key) ?? { label, kind: version.kind === 'template' ? 'Briefvorlage' : 'Formular', versions: [] }
    group.versions.push(version)
    groups.set(key, group)
  }
  return [...groups.entries()].filter(([, group]) => group.label.toLocaleLowerCase('de').includes(search.value.trim().toLocaleLowerCase('de')))
})
const dateFormat = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' })
</script>
<template>
  <div class="settings-panel no-print">
    <section class="editor-panel design-fields">
      <h2>Darstellung</h2>
      <label class="toggle-row">
        <span><strong>Dunkelmodus</strong><small>Die Briefseite bleibt weiß. Deine Einstellung gilt für diesen Browser.</small></span>
        <input type="checkbox" role="switch" :checked="theme === 'dark'" @change="theme = ($event.target as HTMLInputElement).checked ? 'dark' : 'light'">
      </label>
    </section>
    <section class="editor-panel design-fields">
      <h2>Vorlagenversionen</h2>
      <p class="muted">Öffne einen gespeicherten Stand im Designer. Beim Speichern entsteht eine neue Version.</p>
      <StudioCatalogSearch id="version-search" v-model="search" label="Briefvorlagen und Formulare suchen" />
      <p v-if="!groups.length" class="muted">Keine passenden gespeicherten Versionen.</p>
      <details v-for="[key, group] in groups" :key="key" class="version-group">
        <summary>{{ group.label }} <small>{{ group.kind }} · {{ group.versions.length }} {{ group.versions.length === 1 ? 'Version' : 'Versionen' }}</small></summary>
        <ul class="catalog-list">
          <li v-for="(version, index) in group.versions" :key="version.id">
            <div><strong>Version {{ group.versions.length - index }}</strong><small>{{ dateFormat.format(new Date(version.at)) }}</small></div>
            <button class="button subtle" @click="emit('openVersion', version)">Im Designer öffnen</button>
          </li>
        </ul>
      </details>
    </section>
  </div>
</template>
