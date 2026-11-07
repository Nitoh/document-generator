import { jsPDF } from 'jspdf'
import type { LetterLayout } from '~/types/document'
import { formatDate, paginateLines, wrapText } from '~/utils/letter'

export interface PdfFonts { regular: string; bold: string }
const lineHeight = 15 * 25.4 / 72
export function validateLetter(layout: LetterLayout): void {
  const required = [layout.senderName, layout.senderStreet, layout.senderPostalCode, layout.senderCity, layout.recipientName, layout.recipientStreet, layout.recipientPostalCode, layout.recipientCity, layout.subject, layout.salutation, layout.date]
  if (required.some(value => !value.trim())) throw new Error('Bitte vervollständige Absender, Empfänger, Betreff, Anrede und Datum.')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(layout.date)) throw new Error('Bitte wähle ein gültiges Briefdatum.')
}
export function createLetterPdf(layout: LetterLayout, body: string, fonts: PdfFonts): jsPDF {
  validateLetter(layout)
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  pdf.addFileToVFS('Carlito-Regular.ttf', fonts.regular)
  pdf.addFileToVFS('Carlito-Bold.ttf', fonts.bold)
  pdf.addFont('Carlito-Regular.ttf', 'Carlito', 'normal')
  pdf.addFont('Carlito-Bold.ttf', 'Carlito', 'bold')
  pdf.setProperties({ title: layout.subject, author: layout.senderName, creator: 'Nitoh Letter Studio' })
  const font = (size = 11, bold = false) => { pdf.setFont('Carlito', bold ? 'bold' : 'normal'); pdf.setFontSize(size) }
  const wrap = (text: string, width = 165) => wrapText(text, value => pdf.getTextWidth(value), width)
  font()
  const lines = wrap(body)
  const salutation = wrap(layout.salutation)
  const closing = wrap(layout.closing)
  const signature = wrap(layout.signature)
  font(11, true)
  const subject = wrap(layout.subject)
  const pages = paginateLines(lines, Math.max(10, 31 - subject.length - salutation.length - 3), 43, closing.length + signature.length + 4)
  if (pages.length > 50) throw new Error('Der Brief ist zu lang. Bitte kürze ihn auf höchstens 50 Seiten.')
  const drawLines = (text: string[], x: number, y: number, height = lineHeight) => {
    text.forEach((line, index) => pdf.text(line, x, y + index * height))
    return y + text.length * height
  }
  for (const [index, page] of pages.entries()) {
    if (index) pdf.addPage()
    pdf.setTextColor('#171715')
    if (page.first) {
      font(13, true)
      const senderName = wrap(layout.senderName, 140)
      let y = drawLines(senderName, 25, 18, 4.4)
      font(9)
      y = drawLines(wrap(layout.senderStreet, 140), 25, y + 1, 4.4)
      y = drawLines(wrap(`${layout.senderPostalCode} ${layout.senderCity}`, 140), 25, y, 4.4)
      if (y > 41) throw new Error('Der Briefkopf ist zu lang. Bitte kürze die Absenderangaben.')
      if (layout.showLogo) {
        pdf.setFillColor('#171715'); pdf.circle(182, 22, 8, 'F')
        // Vector N, matching the SVG monogram; no rasterisation.
        pdf.setFillColor('#d8c7aa')
        pdf.rect(178.5, 18.75, 1.75, 6.5, 'F')
        pdf.rect(183.75, 18.75, 1.75, 6.5, 'F')
        pdf.triangle(180.25, 18.75, 185.5, 25.25, 183.75, 25.25, 'F')
        pdf.triangle(180.25, 18.75, 178.5, 18.75, 183.75, 25.25, 'F')
      }
      font(7)
      const returned = wrap([layout.senderName, layout.senderStreet, `${layout.senderPostalCode} ${layout.senderCity}`].filter(x => x.trim()).join(' · '), 80)
      if (returned.length > 2) throw new Error('Die Rücksendeangabe ist zu lang. Bitte kürze die Absenderangaben.')
      drawLines(returned, 25, 57, 3)
      font(10)
      const address = [layout.recipientName, layout.recipientStreet, `${layout.recipientPostalCode} ${layout.recipientCity}`].flatMap(value => wrap(value, 80))
      if (address.length > 6) throw new Error('Die Empfängeranschrift ist zu lang für das Anschriftfeld.')
      drawLines(address, 25, 66.2, 4.55)
      let infoY = 52.4
      for (const [label, value] of [['Unser Zeichen', layout.reference], ['Telefon', layout.senderPhone], ['E-Mail', layout.senderEmail], ['Datum', `${layout.city ? `${layout.city}, ` : ''}${formatDate(layout.date)}`]]) {
        if (!value) continue
        font(6.5); pdf.setTextColor('#777469'); pdf.text(label!, 125, infoY)
        font(8); pdf.setTextColor('#171715')
        infoY = drawLines(wrap(value, 65), 125, infoY + 3.7, 3.7) + 2
      }
      if (infoY > 92) throw new Error('Der Informationsblock ist zu lang. Bitte kürze Referenz oder Kontaktdaten.')
    } else {
      font(8, true); pdf.text(layout.senderName, 25, 18)
      font(8); pdf.text(`${formatDate(layout.date)} · ${layout.reference}`, 190, 18, { align: 'right' })
    }
    let y = page.first ? 102 : 34
    if (page.first) {
      font(11, true); y = drawLines(subject, 25, y) + lineHeight * 2
      font(); y = drawLines(salutation, 25, y) + lineHeight
    }
    font(); y = drawLines(page.lines, 25, y)
    if (page.last) {
      y = drawLines(closing, 25, y + lineHeight)
      drawLines(signature, 25, y + lineHeight * 2)
    }
    if (layout.showFoldMarks) {
      pdf.setDrawColor('#777469'); pdf.setLineWidth(.2)
      pdf.line(5, 105, 10, 105); pdf.line(5, 210, 10, 210); pdf.line(5, 148.5, 12, 148.5)
    }
    font(7); pdf.setTextColor('#777469')
    const footer = wrap(layout.footer, 145)
    const footerY = 284 - (footer.length - 1) * 3.5
    pdf.setDrawColor('#d8d4ca'); pdf.setLineWidth(.2); pdf.line(25, footerY - 4, 190, footerY - 4)
    drawLines(footer, 25, footerY, 3.5)
    pdf.text(`${index + 1} / ${pages.length}`, 190, footerY, { align: 'right' })
  }
  return pdf
}
