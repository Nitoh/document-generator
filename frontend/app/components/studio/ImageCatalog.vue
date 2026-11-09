<script setup lang="ts">
import type { LibraryImage } from '~/types/document'
const props = defineProps<{ items: LibraryImage[] }>()
defineEmits<{ edit: [LibraryImage] }>()
const search = ref('')
const category = ref('')
const categories = computed(() => [...new Set(props.items.map(item => item.category))].sort((a, b) => a.localeCompare(b, 'de')))
const items = computed(() => props.items.filter(item => (!category.value || item.category === category.value) &&
  item.name.toLocaleLowerCase('de').includes(search.value.trim().toLocaleLowerCase('de'))))
</script>
<template>
  <StudioCategoryBrowser v-model:search="search" v-model:category="category" :categories="categories" search-label="Bilder suchen">
    <p v-if="!items.length" class="muted">Keine passenden Bilder gefunden.</p>
    <ul class="image-catalog catalog-list">
      <li v-for="item in items" :key="item.id">
        <img :src="item.image.data" alt="">
        <div><strong>{{ item.name }}</strong><small>{{ item.category }}</small></div>
        <button class="button subtle" @click="$emit('edit', item)">Bearbeiten</button>
      </li>
    </ul>
  </StudioCategoryBrowser>
</template>
