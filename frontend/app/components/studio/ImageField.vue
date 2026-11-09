<script setup lang="ts">
import { imageGeometry, type ImageRole } from '~/utils/letter-geometry'
import type { LibraryImage, LetterImage } from '~/types/document'
const props = defineProps<{ label: string; role?: ImageRole; libraryEntry?: boolean }>()
const library = inject<Ref<LibraryImage[]>>('studio-images', ref([]))
const selection = ref('')
const unit = ref<'mm' | 'cm'>('mm')
const factor = computed(() => unit.value === 'mm' ? 1 : 10)
const placement = computed(() => image.value?.placement)
function enable() {
  if (!image.value || !props.role) return
  const geometry = imageGeometry(image.value, props.role)
  image.value.placement = { align: props.role === 'logo' ? 'right' : 'left', x: 0, y: geometry.y, width: geometry.width, tabs: 0 }
}
function setDimension(key: 'width' | 'x' | 'y' | 'tabs', event: Event) {
  if (!placement.value) return
  const value = Number((event.target as HTMLInputElement).value) * (key === 'tabs' ? 1 : factor.value)
  const limits = { width: [0, props.role === 'logo' ? 45 : 165], x: [-165, 165], y: [0, props.role === 'logo' ? 10 : 25], tabs: [0, 12] }
  const [min, max] = limits[key]!
  placement.value[key] = Math.min(max!, Math.max(min!, value || 0))
}
function choose(event: Event) {
  selection.value = (event.target as HTMLSelectElement).value
  const item = library.value.find(item => item.id === selection.value)
  if (item) image.value = JSON.parse(JSON.stringify(item.image))
}

const image = defineModel<LetterImage | null | undefined>()
const error = ref('')
async function upload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  error.value = ''
  if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 10_000_000) {
    error.value = 'Wähle eine PNG- oder JPEG-Datei bis 10 MB.'
    return
  }
  try {
    const bitmap = await createImageBitmap(file)
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    let ratio = Math.min(1, 640 / Math.max(bitmap.width, bitmap.height))
    try {
      for (let attempt = 0; attempt < 12; attempt++) {
        canvas.width = Math.max(1, Math.round(bitmap.width * ratio))
        canvas.height = Math.max(1, Math.round(bitmap.height * ratio))
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
        const data = canvas.toDataURL(file.type, .85)
        if (data.length <= 110_000) {
          image.value = { data, width: canvas.width, height: canvas.height }
          return
        }
        ratio *= .75
      }
      throw new Error()
    } finally { bitmap.close() }
  } catch { error.value = 'Das Bild konnte nicht verarbeitet werden.' }
}
</script>
<template>
  <div class="image-field">
    <label v-if="!libraryEntry && library.length">Aus Bildbibliothek
      <select :value="selection" @change="choose">
        <option value="">Bild auswählen</option>
        <option v-for="item in library" :key="item.id" :value="item.id">{{ item.category }} · {{ item.name }}</option>
      </select>
    </label>
    <label>{{ label }} <input type="file" accept="image/png,image/jpeg" @change="upload"></label>
    <img v-if="image" :src="image.data" :alt="label">
    <button v-if="image" class="button subtle" @click="image = null">Bild entfernen</button>
    <details v-if="image && role" class="image-settings">
      <summary>Größe und Position</summary>
      <button v-if="!placement" class="button subtle" @click="enable">Position einstellen</button>
      <template v-else>
        <div class="format-grid">
          <label>Ausrichtung <select v-model="placement.align"><option value="left">Links</option><option value="center">Zentriert</option><option value="right">Rechts</option></select></label>
          <label>Einheit <select v-model="unit"><option>mm</option><option>cm</option></select></label>
          <label>Breite ({{ unit }}) <input type="number" min="0" step="0.1" :value="placement.width / factor" @input="setDimension('width', $event)"></label>
          <label>Horizontal ({{ unit }}) <input type="number" step="0.1" :value="placement.x / factor" @input="setDimension('x', $event)"></label>
          <label>Vertikal ({{ unit }}) <input type="number" min="0" step="0.1" :value="placement.y / factor" @input="setDimension('y', $event)"></label>
          <label>Tabstopps (12,5 mm) <input  :value="placement.tabs" @input="setDimension('tabs', $event)" type="number" min="0" max="12"></label>
        </div>
        <button class="button subtle" @click="image.placement = undefined">Standardposition verwenden</button>
      </template>
    </details>
    <p v-if="error"  role="alert">{{ error }}</p>
  </div>
</template>
