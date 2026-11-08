<script setup lang="ts">
defineProps<{ localMode: boolean; templateCount: number }>()
defineEmits<{ library: []; fresh: [] }>()
</script>
<template>
  <aside class="sidebar no-print">
    <NuxtLink to="/" class="brand"><BrandNitohMark decorative /><span>NITOH<span class="brand-sub">LETTER STUDIO</span></span></NuxtLink>
    <div class="nav-label">DEIN ARBEITSPLATZ</div>
    <nav aria-label="Hauptnavigation">
      <NuxtLink to="/" class="nav-item active"><span aria-hidden="true">▤</span> Brief erstellen <span class="nav-arrow">↗</span></NuxtLink>
      <button class="nav-item" @click="$emit('library')"><span aria-hidden="true">▦</span> Meine Vorlagen <span class="count">{{ templateCount }}</span></button>
      <button class="nav-item new-draft" aria-label="Neue Briefvorlage" @click="$emit('fresh')"><span aria-hidden="true">＋</span><span class="nav-text">Neue Briefvorlage</span></button>
    </nav>
    <div class="sidebar-note"><span class="little-star">✳</span><h3>Gute Worte verdienen<br>einen guten Rahmen.</h3><p>Dein Brief. Klar gestaltet.<br>Bereit für Papier.</p><div class="mode"><span />{{ localMode ? 'Auf diesem Gerät' : 'Mit lokalem Backend' }}</div></div>
    <div class="sidebar-bottom">NITOH STUDIO <span>01</span></div>
  </aside>
</template>
