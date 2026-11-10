import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { createDraft } from '../app/utils/letter'
import { defaultFormat, formatBody } from '../app/utils/letter-format'
import { createLetterPdf } from '../app/utils/pdf'
const fonts = {
  regular: readFileSync(new URL('../app/assets/fonts/Carlito-Regular.ttf', import.meta.url)).toString('base64'),
  bold: readFileSync(new URL('../app/assets/fonts/Carlito-Bold.ttf', import.meta.url)).toString('base64')
}
describe('print-ready PDF', () => {
  it('embeds a Unicode font and creates A4 pages', () => {
    const pdf = createLetterPdf(createDraft().layout, 'Grüße für Müller und Łukasz.', fonts)
    expect(pdf.getNumberOfPages()).toBe(1)
    expect(pdf.internal.pageSize.getWidth()).toBeCloseTo(210, 1)
    expect(pdf.internal.pageSize.getHeight()).toBeCloseTo(297, 1)
    expect(pdf.output()).toContain('/FontFile2')
  })
  it('creates continuation pages without dropping the closing', () => {
    const pdf = createLetterPdf(createDraft().layout, Array(150).fill('Eine Zeile im mehrseitigen Brief.').join('\n'), fonts)
    expect(pdf.getNumberOfPages()).toBeGreaterThan(3)
  })
  it('exports every simple layout and header combination as A4', () => {
    for (const design of ['classic','minimal','line'] as const) for (const headerStyle of ['standard','compact','centered'] as const) {
      const pdf = createLetterPdf({ ...createDraft().layout, design, headerStyle }, 'Ein wiederverwendbarer Brief.', fonts)
      expect(pdf.getNumberOfPages()).toBe(1)
      expect(pdf.internal.pageSize.getWidth()).toBeCloseTo(210, 1)
    }
  })
  it('appends each form after the letter, including continuation pages', () => {
    const layout = createDraft().layout
    layout.attachments = [
      { id: 'conditions', title: 'Vertragsanlage', content: 'Bedingungen' },
      { id: 'form', title: 'Rückmeldung', content: Array(60).fill('Formularzeile').join('\n') }
    ]
    const pdf = createLetterPdf(layout, 'Ein Brief mit Anlagen.', fonts)
    expect(pdf.getNumberOfPages()).toBe(4)
  })
  it('embeds uploaded images in the letter and in the attached form', () => {
    const image = { data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4v4ABAARBAaDRYrMyAAAAAElFTkSuQmCC', width: 1, height: 1 }
    const layout = { ...createDraft().layout, logoImage: image, signatureImage: image,
      attachments: [{ id: 'form', title: 'Anlage', content: 'Mit Bild', image }] }
    const pdf = createLetterPdf(layout, 'Brief mit Logo.', fonts)
    expect(pdf.getNumberOfPages()).toBe(2)
    expect(pdf.output()).toContain('/Subtype /Image')
  })
  it('renders a formatted paragraph with millimetre spacing and a PDF text transform', () => {
    const format = { ...defaultFormat(true), align: 'center' as const, tabs: 1, indent: 10, before: 10, italic: true }
    const body = formatBody('Erste Zeile', [format], text => text.length)
    expect(body.slice(0, -1).reduce((sum, line) => sum + line.height, 0)).toBe(10)
    expect(body.at(-1)?.indent).toBe(22.5)
    const layout = { ...createDraft().layout, bodyFormats: [format] }
    const pdf = createLetterPdf(layout, 'Erste Zeile', fonts)
    expect(pdf.getNumberOfPages()).toBe(1)
    expect(pdf.output()).toContain('/FontFile2')
  })
  it('uses right indent to wrap a block and keeps the requested space after it', () => {
    const style = { ...defaultFormat(), indent: 10, rightIndent: 100, after: 7, underline: true }
    const lines = formatBody('Alpha Bravo', [style], text => text.length * 6)
    const content = lines.filter(line => line.text)
    expect(content.map(line => line.text)).toEqual(['Alpha', 'Bravo'])
    expect(content.every(line => line.rightIndent === 100 && line.format.underline)).toBe(true)
    expect(lines.filter(line => !line.text).reduce((total, line) => total + line.height, 0)).toBe(7)
  })
  it('omits a disabled header and does not require a date for a hidden information block', () => {
    const layout = { ...createDraft().layout, showHeader: false, showInformation: false, date: '',
      logoImage: { data: 'invalid image must not be rendered', width: 1, height: 1 } }
    const pdf = createLetterPdf(layout, 'Brief ohne Kopf und Informationsblock.', fonts)
    expect(pdf.getNumberOfPages()).toBe(1)
    expect(pdf.output()).not.toContain('/Subtype /Image')
    expect(() => createLetterPdf({ ...layout, showInformation: true }, 'Brief.', fonts)).toThrow('Briefdatum')
  })
  it('rejects missing recipient and overflowing address data', () => {
    const layout = createDraft().layout
    expect(() => createLetterPdf({ ...layout, recipientName: '' }, 'Text', fonts)).toThrow('vervollständige')
    expect(() => createLetterPdf({ ...layout, recipientName: 'Langer Name '.repeat(80) }, 'Text', fonts)).toThrow('Anschrift')
  })
})
