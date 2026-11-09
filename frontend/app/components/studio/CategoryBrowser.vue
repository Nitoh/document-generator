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
      <UiFormField v-if="categories.length > 8" id="category-search" v-model="categorySearch" label="Kategorien filtern" type="search" />
      <div class="category-options">
        <button :aria-pressed="category === ''" @click="category = ''">Alle</button>
        <button v-for="item in filtered" :key="item" :aria-pressed="category === item" @click="category = item">{{ item }}</button>
      </div>
    </aside>
    <div class="category-results">
      <UiFormField id="catalog-search" v-model="search" :label="searchLabel" type="search" />
      <slot />
    </div>
  </div>
</template>
