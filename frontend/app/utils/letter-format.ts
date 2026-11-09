import type { TextBlockFormat } from '~/types/document'
import { tabMm } from './letter-geometry'

export const lineHeightMm = 15 * 25.4 / 72
export const blockWidthMm = 165
export function defaultFormat(bold = false): TextBlockFormat {
  return { align: 'left', indent: 0, tabs: 0, before: 0, bold, italic: false }
}
export interface FormattedLine { text: string; format: TextBlockFormat; indent: number; rightIndent: number; height: number }
type Measure = (text: string, format: TextBlockFormat) => number
export function splitBlocks(text: string) { return text.split(/\r?\n[ \t]*\r?\n/) }
export function formatLines(text: string, format: TextBlockFormat | null | undefined, measure: Measure, bold = false): FormattedLine[] {
  const style = format ?? defaultFormat(bold)
  const indent = Math.min(135, Math.max(0, Number(style.indent || 0) + Number(style.tabs || 0) * tabMm))
  const rightIndent = Math.min(135 - indent, Math.max(0, Number(style.rightIndent) || 0))
  const blank = { text: '', format: style, indent, rightIndent, height: lineHeightMm }
  function spacing(value?: number) {
    const amount = Math.min(50, Math.max(0, Number(value) || 0))
    return Array.from({ length: Math.ceil(amount / lineHeightMm) }, (_, index) => ({
      ...blank, height: Math.min(lineHeightMm, amount - index * lineHeightMm)
    }))
  }
  const lines = wrapText(text, value => measure(value, style), blockWidthMm - indent - rightIndent)
  return [...spacing(style.before), ...lines.map(value => ({ ...blank, text: value })), ...spacing(style.after)]
}
export function formatBody(text: string, formats: (TextBlockFormat | null)[] | undefined, measure: Measure): FormattedLine[] {
  if (!formats?.some(Boolean)) return formatLines(text, undefined, measure)
  return splitBlocks(text).flatMap((block, index) => [
    ...(index ? formatLines('', undefined, measure) : []),
    ...formatLines(block, formats[index], measure)
  ])
}

// Exact same 11pt Arial font and 15pt line height as the printed pages.
export function wrapText(text: string, measure: (text: string) => number, width: number): string[] {
  const output: string[] = []
  for (const paragraph of text.replace(/\r/g, '').split('\n')) {
    if (!paragraph.trim()) { output.push(''); continue }
    let line = ''
    for (const word of paragraph.trim().split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word
      if (measure(candidate) <= width) { line = candidate; continue }
      if (line) { output.push(line); line = '' }
      for (const char of word) {
        if (line && measure(line + char) > width) { output.push(line); line = '' }
        line += char
      }
    }
    if (line) output.push(line)
  }
  return output.length ? output : ['']
}
