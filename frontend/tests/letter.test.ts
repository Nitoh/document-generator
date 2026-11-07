import { describe, expect, it } from 'vitest'
import { paginateLines, wrapText, formatDate } from '../app/utils/letter'
import { renderTemplate, templateFields, validateTemplate } from '../app/utils/template'

describe('letter content', () => {
  it('replaces repeated Unicode fields once and preserves literal HTML and dollars', () => {
    expect(templateFields('{{Änderung}} {{Name}} {{ Name }}')).toEqual(['Änderung', 'Name'])
    expect(renderTemplate('{{Name}} / {{Name}}', { Name: '$1 {{Datum}} <script>' })).toBe('$1 {{Datum}} <script> / $1 {{Datum}} <script>')
  })
  it('rejects invalid syntax and missing/case-mismatched values', () => {
    expect(() => renderTemplate('{{Name}}', { name: 'Erika' })).toThrow('Name')
    expect(() => renderTemplate('{{bad-name}}', {})).toThrow('Ungültiger')
    expect(() => renderTemplate('{{Name}}', { Name: ' ' })).toThrow('ausfüllen')
  })
  it('wraps long words without losing characters and preserves empty paragraphs', () => {
    const lines = wrapText('abcdefghijkl\n\nZwei Worte', s => s.length, 5)
    expect(lines.slice(0, 3).join('')).toBe('abcdefghijkl')
    expect(lines).toContain('')
    expect(lines.every(line => line.length <= 5)).toBe(true)
  })
  it('paginates every line once and keeps the closing on the last page', () => {
    const lines = Array.from({ length: 110 }, (_, i) => `Zeile ${i}`)
    const pages = paginateLines(lines)
    expect(pages.flatMap(p => p.lines)).toEqual(lines)
    expect(pages[0]!.first).toBe(true)
    expect(pages.filter(p => p.last)).toHaveLength(1)
    expect(pages.at(-1)!.lines.length + 6).toBeLessThanOrEqual(43)
  })
  it('puts closing on a new page when the last line fills the first page', () => {
    const pages = paginateLines(Array(25).fill('Zeile'))
    expect(pages).toHaveLength(2)
    expect(pages[1]!.last).toBe(true)
    expect(pages[1]!.lines).toEqual([])
  })
  it('validates a template without requiring its placeholder values', () => {
    expect(() => validateTemplate('{{Name}}')).not.toThrow()
    expect(() => validateTemplate(' ')).toThrow()
    expect(() => validateTemplate('{{bad-name}}')).toThrow()
  })
  it('formats a date without a timezone conversion', () => {
    expect(formatDate('2026-11-08')).toBe('08.11.2026')
  })
})
