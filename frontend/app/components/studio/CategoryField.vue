<script setup lang="ts">
const props = defineProps<{ categories: string[]; id: string }>()
const category = defineModel<string>({ required: true })
const creating = ref(Boolean(category.value && !props.categories.includes(category.value)))
const choices = computed(() => [...new Set(props.categories)].sort((a, b) => a.localeCompare(b, 'de')))
function select(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  creating.value = value === '__new__'
  category.value = creating.value ? '' : value
}
</script>
<template>
  <div class="form-field">
    <label :for="id">Kategorie</label>
    <select :id="id" :value="creating ? '__new__' : category" @change="select">
      <option value="">Kategorie auswählen</option>
      <option v-for="item in choices" :key="item">{{ item }}</option>
      <option value="__new__">＋ Neue Kategorie erstellen …</option>
    </select>
    <UiFormField v-if="creating" :id="`${id}-new`" v-model="category" label="Name der neuen Kategorie" :maxlength="80" hint="Beim Speichern wird die Kategorie angelegt." />
  </div>
</template>
