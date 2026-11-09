<script setup lang="ts">
import type { LetterImage } from '~/types/document'
defineProps<{ label: string }>()
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
    <label>{{ label }} <input type="file" accept="image/png,image/jpeg" @change="upload"></label>
    <img v-if="image" :src="image.data" :alt="label">
    <button v-if="image" class="button subtle" @click="image = null">Bild entfernen</button>
    <p v-if="error" role="alert">{{ error }}</p>
  </div>
</template>
