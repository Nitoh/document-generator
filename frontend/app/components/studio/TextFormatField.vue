<script setup lang="ts">
import type { TextBlockFormat } from '~/types/document'
import { defaultFormat } from '~/utils/letter-format'

const props = defineProps<{ label: string; protectedBlock?: boolean; bold?: boolean }>()
const model = defineModel<TextBlockFormat | null | undefined>()
const style = computed(() => model.value ?? defaultFormat(props.bold))
const positionOpen = ref(false)
const toolbar = useTemplateRef<HTMLElement>('toolbar')
const focused = ref(0)
const unit = ref<'mm' | 'cm'>('mm')
const factor = computed(() => unit.value === 'mm' ? 1 : 10)
const tools = [
  { key: 'left', label: 'Linksbündig', glyph: 'M3 4h14M3 8h9M3 12h14M3 16h9' },
  { key: 'center', label: 'Zentriert', glyph: 'M3 4h14M6 8h8M3 12h14M6 16h8' },
  { key: 'right', label: 'Rechtsbündig', glyph: 'M3 4h14M8 8h9M3 12h14M8 16h9' },
  { key: 'bold', label: 'Fett', glyph: 'F' },
  { key: 'italic', label: 'Kursiv', glyph: 'K' },
  { key: 'underline', label: 'Unterstrichen', glyph: 'U' }
] as const
type Tool = typeof tools[number]['key']

function allowOverride() {
  return Boolean(model.value) || !props.protectedBlock ||
    window.confirm(`„${props.label}“ folgt dem Standardlayout. Eine andere Ausrichtung oder andere Abstände können davon abweichen. Formatierung freigeben?`)
}
function apply(key: Tool) {
  const previous = style.value
  if (key === 'left' || key === 'center' || key === 'right') {
    if (key !== previous.align && allowOverride()) model.value = { ...previous, align: key }
  } else if (allowOverride()) model.value = { ...previous, [key]: !previous[key] }
}
function pressed(key: Tool) {
  if (key === 'left' || key === 'center' || key === 'right') return style.value.align === key
  return Boolean(style.value[key])
}
function setDimension(key: 'indent' | 'rightIndent' | 'before' | 'after' | 'tabs', event: Event) {
  const input = event.target as HTMLInputElement
  const scale = key === 'tabs' ? 1 : factor.value
  const value = Math.max(0, Math.min(Number(input.max), Number(input.value))) * scale
  const previous = style.value[key] ?? 0
  const accepted = value === previous || allowOverride()
  if (accepted && value !== previous) model.value = { ...style.value, [key]: value }
  input.value = String((accepted ? value : previous) / scale)
}
function moveFocus(event: KeyboardEvent) {
  const controls = [...(toolbar.value?.querySelectorAll('button') ?? [])]
  const last = controls.length - 1
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? last
    : event.key === 'ArrowRight' ? (focused.value + 1) % controls.length
    : event.key === 'ArrowLeft' ? (focused.value + last) % controls.length : undefined
  if (next === undefined) return
  event.preventDefault()
  controls[next]?.focus()
}
</script>
<template>
  <div class="block-format">
    <div ref="toolbar" class="format-toolbar" role="toolbar" :aria-label="`Formatierung für ${label}`" @keydown="moveFocus">
      <button v-for="(tool, index) in tools" :key="tool.key" type="button" :class="`format-${tool.key}`"
        :tabindex="focused === index ? 0 : -1" :aria-label="tool.label" :title="tool.label" :aria-pressed="pressed(tool.key)"
        @focus="focused = index" @click="apply(tool.key)">
        <svg v-if="index < 3" viewBox="0 0 20 20" aria-hidden="true"><path :d="tool.glyph" /></svg>
        <span v-else aria-hidden="true">{{ tool.glyph }}</span>
      </button>
      <button type="button" class="format-position" :tabindex="focused === tools.length ? 0 : -1"
        :aria-expanded="positionOpen" @focus="focused = tools.length" @click="positionOpen = !positionOpen">Position &amp; Abstände</button>
    </div>
    <div v-if="positionOpen" class="block-position">
      <div class="format-grid">
        <label>Einheit <select v-model="unit"><option>mm</option><option>cm</option></select></label>
        <label>Tabstopps (12,5 mm) <input type="number" min="0" max="10" step="1" :value="style.tabs" @change="setDimension('tabs', $event)"></label>
        <label>Einzug links ({{ unit }}) <input type="number" min="0" :max="135 / factor" step="any" :value="style.indent / factor" @change="setDimension('indent', $event)"></label>
        <label>Einzug rechts ({{ unit }}) <input type="number" min="0" :max="135 / factor" step="any" :value="(style.rightIndent ?? 0) / factor" @change="setDimension('rightIndent', $event)"></label>
        <label>Abstand davor ({{ unit }}) <input type="number" min="0" :max="50 / factor" step="any" :value="style.before / factor" @change="setDimension('before', $event)"></label>
        <label>Abstand danach ({{ unit }}) <input type="number" min="0" :max="50 / factor" step="any" :value="(style.after ?? 0) / factor" @change="setDimension('after', $event)"></label>
      </div>
      <p class="field-hint">Einzüge beginnen am Satzspiegel. Die Reihenfolge der Textbausteine änderst du mit ↑ und ↓.</p>
      <button v-if="model" class="button subtle" type="button" @click="model = null">Formatierung zurücksetzen</button>
    </div>
  </div>
</template>
