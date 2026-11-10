<script setup lang="ts">
type Section = 'home' | 'settings' | 'letter' | 'library' | 'history' | 'archive'
defineProps<{ section: Section }>()
defineEmits<{ navigate: [Section] }>()
const items = [{ id: 'home', title: 'Startseite' }, { id: 'letter', title: 'Brief erstellen' }, { id: 'library', title: 'Library' }, { id: 'history', title: 'Historie' }, { id: 'archive', title: 'Archiv' }, { id: 'settings', title: 'Einstellungen' }] as const
</script>
<template>
  <aside class="sidebar no-print">
    <button class="brand brand-button" @click="$emit('navigate', 'home')"><BrandNitohMark decorative /><span>NITOH<span class="brand-sub">LETTER STUDIO</span></span></button>
    <nav aria-label="Hauptnavigation">
      <button v-for="item in items" :key="item.id" class="nav-item" :class="{ active: section === item.id }" :aria-current="section === item.id ? 'page' : undefined" @click="$emit('navigate', item.id)">{{ item.title }}</button>
    </nav>
  </aside>
</template>
