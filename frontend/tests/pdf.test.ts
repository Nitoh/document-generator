import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { createDraft } from '../app/utils/letter'
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
  it('rejects missing recipient and overflowing address data', () => {
    const layout = createDraft().layout
    expect(() => createLetterPdf({ ...layout, recipientName: '' }, 'Text', fonts)).toThrow('vervollständige')
    expect(() => createLetterPdf({ ...layout, recipientName: 'Langer Name '.repeat(80) }, 'Text', fonts)).toThrow('Anschrift')
  })
})
