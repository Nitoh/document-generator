<script setup lang="ts">
const props = defineProps<{ categories: string[]; searchLabel: string }>()
const search = defineModel<string>('search', { required: true })
const category = defineModel<string>('category', { required: true })
const categorySearch = ref('')
const filtered = computed(() => props.categories.filter(item => item.toLocaleLowerCase('de').includes(categorySearch.value.trim().toLocaleLowerCase('de'))))
</script>
<template>
  <div class="category-browser">
    <aside aria-label="Kategorien">
      <h3>Kategorien</h3>
      <StudioCatalogSearch v-if="categories.length" id="category-search" v-model="categorySearch" label="Kategorien filtern" />
      <div class="category-options">
        <button :aria-pressed="category === ''" @click="category = ''">Alle</button>
        <button v-for="item in filtered" :key="item" :aria-pressed="category === item" @click="category = item">{{ item }}</button>
        <p v-if="!filtered.length && categorySearch" class="muted">Keine passende Kategorie.</p>
      </div>
    </aside>
    <div class="category-results">
      <StudioCatalogSearch id="catalog-search" v-model="search" :label="searchLabel" />
      <slot />
    </div>
  </div>
</template>
