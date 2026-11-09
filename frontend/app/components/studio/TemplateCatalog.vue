<script setup lang="ts">
import type { DocumentTemplate } from '~/types/document'
const props = defineProps<{ items: DocumentTemplate[]; manage?: boolean }>()
defineEmits<{ select: [DocumentTemplate]; remove: [DocumentTemplate] }>()
const search = ref('')
const category = ref('')
const categories = computed(() => [...new Set(props.items.map(item => item.category))].sort((a, b) => a.localeCompare(b, 'de')))
const grouped = computed(() => categories.value.filter(group => !category.value || category.value === group).map(group => ({
  group,
  items: props.items.filter(item => item.category === group &&
    [item.name, item.category, item.layout.subject].join(' ').toLocaleLowerCase('de').includes(search.value.trim().toLocaleLowerCase('de')))
})).filter(entry => entry.items.length))
</script>
<template>
  <section class="catalog no-print" aria-label="Briefvorlagen">
    <StudioCategoryBrowser v-model:search="search" v-model:category="category" :categories="categories" search-label="Briefvorlagen suchen">
    <p v-if="!grouped.length" class="muted">Keine passende Briefvorlage gefunden.</p>
    <section v-for="entry in grouped" :key="entry.group">
      <h2>{{ entry.group }}</h2>
      <ul class="catalog-list">
        <li v-for="item in entry.items" :key="item.id">
          <div><strong>{{ item.name }}</strong><small>{{ item.id.startsWith('starter:') ? 'Mitgelieferte Vorlage' : item.layout.subject }}</small></div>
          <div class="catalog-actions">
            <button class="button subtle" @click="$emit('select', item)">{{ manage ? (item.id.startsWith('starter:') ? 'Als eigene Vorlage öffnen' : 'Bearbeiten') : 'Verwenden' }}</button>
            <button v-if="manage && !item.id.startsWith('starter:')" class="button subtle" @click="$emit('remove', item)">Löschen</button>
          </div>
        </li>
      </ul>
    </section>
    </StudioCategoryBrowser>
  </section>
</template>
