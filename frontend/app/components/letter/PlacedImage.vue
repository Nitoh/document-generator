<script setup lang="ts">
import type { LetterImage } from '~/types/document'
import { imageGeometry, type ImageRole } from '~/utils/letter-geometry'
const props = defineProps<{ image: LetterImage; role: ImageRole; designer?: boolean; label: string }>()
const geometry = computed(() => imageGeometry(props.image, props.role))
let drag: { pointer: number; clientX: number; clientY: number; x: number; y: number; mm: number } | undefined
function begin(event: PointerEvent) {
  if (!props.designer || event.button !== 0) return
  const target = event.currentTarget as HTMLElement
  const sheet = target.closest('.letter-page')!
  drag = { pointer: event.pointerId, clientX: event.clientX, clientY: event.clientY, x: geometry.value.x, y: geometry.value.y, mm: 210 / sheet.getBoundingClientRect().width }
  target.setPointerCapture(event.pointerId)
}
function move(event: PointerEvent) {
  if (!drag || drag.pointer !== event.pointerId) return
  const width = props.image.placement?.width ?? geometry.value.width
  const x = Math.round((drag.x + (event.clientX - drag.clientX) * drag.mm) * 10) / 10
  const y = Math.round((drag.y + (event.clientY - drag.clientY) * drag.mm) * 10) / 10
  const next = { ...props.image, placement: { align: 'left' as const, width, x, y, tabs: 0 } }
  const bounded = imageGeometry(next, props.role)
  props.image.placement = { ...next.placement, x: bounded.x, y: bounded.y }
}
</script>
<template>
  <div class="placed-image" :class="[`placed-${role}`, { 'drag-image': designer }]" :style="{ height: `${geometry.y + geometry.height}mm` }">
    <img :src="image.data" :alt="label" :draggable="false"
      :style="{ left: `${geometry.x}mm`, top: `${geometry.y}mm`, width: `${geometry.width}mm`, height: `${geometry.height}mm` }"
      @pointerdown="begin" @pointermove="move" @pointerup="drag = undefined" @pointercancel="drag = undefined" @lostpointercapture="drag = undefined">
  </div>
</template>
