<script setup lang="ts">
import type { FormattedLine } from '~/utils/letter-format'
defineProps<{ lines: FormattedLine[] }>()
</script>
<template>
  <span v-for="(line, index) in lines" :key="index" class="text-line formatted-line"
    :style="{ height: `${line.height}mm`, marginLeft: `${line.indent}mm`, marginRight: `${line.rightIndent}mm`, textDecoration: line.format.underline && line.text ? 'underline' : 'none', textAlign: line.format.align, fontWeight: line.format.bold ? '700' : '400', fontStyle: line.format.italic ? 'italic' : 'normal' }">{{ line.text || '\u00a0' }}</span>
</template>
