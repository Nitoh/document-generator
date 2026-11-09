<script setup lang="ts">
type Section = 'letter' | 'library' | 'history'
defineProps<{ section: Section }>()
defineEmits<{ navigate: [Section] }>()
const items = [{ id: 'letter', title: 'Brief erstellen' }, { id: 'library', title: 'Library' }, { id: 'history', title: 'Historie' }] as const
</script>
<template>
  <aside class="sidebar no-print">
    <button class="brand brand-button" @click="$emit('navigate', 'letter')"><BrandNitohMark decorative /><span>NITOH<span class="brand-sub">LETTER STUDIO</span></span></button>
    <nav aria-label="Hauptnavigation">
      <button v-for="item in items" :key="item.id" class="nav-item" :class="{ active: section === item.id }" :aria-current="section === item.id ? 'page' : undefined" @click="$emit('navigate', item.id)">{{ item.title }}</button>
    </nav>
  </aside>
</template>
