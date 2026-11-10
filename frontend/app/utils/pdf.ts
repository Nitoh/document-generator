import { jsPDF } from 'jspdf'
import type { LetterImage, LetterLayout, TextBlockFormat } from '~/types/document'
import { formatBody, formatLines, lineHeightMm, wrapText, type FormattedLine } from './letter-format'
import { imageGeometry, type ImageRole } from './letter-geometry'
import { attachmentPages, formatDate, paginateLines, validateLetter } from '~/utils/letter'

export interface PdfFonts { regular: string; bold: string }
const lineHeight = lineHeightMm
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
  const measure = (text: string, format: TextBlockFormat) => {
    font(11, format.bold)
    return pdf.getTextWidth(text)
  }
  const formats = layout.sectionFormats
  const lines = formatBody(body, layout.bodyFormats, measure)
  const salutation = formatLines(layout.salutation, formats?.salutation, measure)
  const closingText = layout.closingText?.trim() ? formatLines(layout.closingText, formats?.closingText, measure) : []
  const closing = formatLines(layout.closing, formats?.closing, measure)
  const signature = formatLines(layout.signature, formats?.signature, measure)
  const subject = formatLines(layout.subject, formats?.subject, measure, true)
  const signatureGeometry = layout.signatureImage && imageGeometry(layout.signatureImage, 'signature')
  const pages = paginateLines(lines, Math.max(10, 31 - subject.length - salutation.length - 3), 43,
    closingText.length + (closingText.length ? 1 : 0) + closing.length + signature.length + 4 +
    (signatureGeometry ? Math.ceil((signatureGeometry.height + signatureGeometry.y) / lineHeight) : 0))
  const annexes = attachmentPages(layout.attachments ?? [], text => { font(); return pdf.getTextWidth(text) }, 165, measure)
  const totalPages = pages.length + annexes.length
  if (totalPages > 50) throw new Error('Der Brief ist zu lang. Bitte kürze ihn auf höchstens 50 Seiten.')
  const drawLines = (text: string[], x: number, y: number, height = lineHeight) => {
    text.forEach((line, index) => pdf.text(line, x, y + index * height))
    return y + text.length * height
  }
  function drawFormatted(lines: FormattedLine[], y: number) {
    for (const line of lines) {
      const baseline = y
      y += line.height
      if (!line.text) continue
      font(11, line.format.bold)
      const width = pdf.getTextWidth(line.text)
      const available = Math.max(0, 165 - line.indent - line.rightIndent - width)
      const x = 25 + line.indent + (line.format.align === 'center' ? available / 2 : line.format.align === 'right' ? available : 0)
      if (line.format.italic) {
        pdf.advancedAPI(() => { pdf.text(line.text, x, baseline, {}, pdf.Matrix(1, 0, -.22, 1, 0, 0)) })
      } else pdf.text(line.text, x, baseline)
      if (line.format.underline) {
        pdf.saveGraphicsState()
        pdf.setDrawColor('#171715')
        pdf.setLineWidth(.18)
        pdf.line(x, baseline + .7, x + width, baseline + .7)
        pdf.restoreGraphicsState()
      }
    }
    return y
  }
  function drawImage(image: LetterImage, y: number, role: ImageRole) {
    const geometry = imageGeometry(image, role)
    pdf.addImage(image.data, image.data.startsWith('data:image/png') ? 'PNG' : 'JPEG',
      25 + geometry.x, y + geometry.y, geometry.width, geometry.height)
    return geometry.y + geometry.height
  }
  for (const [index, page] of pages.entries()) {
    if (index) pdf.addPage()
    pdf.setTextColor('#171715')
    if (page.first) {
      if (layout.showHeader !== false) {
        const header = layout.headerStyle || 'standard'
        const centered = header === 'centered'
        const headerX = centered ? 107.5 : 25
        const headerWidth = centered ? 120 : 140
        font(header === 'compact' ? 11 : layout.design === 'minimal' ? 12 : 13, layout.design !== 'minimal')
        const headerLine = (text: string[], y: number) => {
          text.forEach((line,index) => pdf.text(line, headerX, y + index * 4.4, centered ? { align: 'center' } : {}))
          return y + text.length * 4.4
        }
        let y = headerLine(wrap(layout.senderName, headerWidth), 18)
        font(9)
        if (header === 'compact') {
          y = headerLine(wrap(`${layout.senderStreet} · ${layout.senderPostalCode} ${layout.senderCity}`, headerWidth), y + 1)
        } else {
          y = headerLine(wrap(layout.senderStreet, headerWidth), y + 1)
          y = headerLine(wrap(`${layout.senderPostalCode} ${layout.senderCity}`, headerWidth), y)
        }
        if (y > 39) throw new Error('Der Briefkopf ist zu lang. Bitte kürze die Absenderangaben.')
        if (layout.design === 'line') {
          pdf.setDrawColor('#bda783'); pdf.setLineWidth(.3); pdf.line(25, 39, 190, 39)
        }
        if (layout.logoImage) {
          drawImage(layout.logoImage, 14, 'logo')
        } else if (layout.showLogo) {
          pdf.setFillColor('#171715'); pdf.circle(182, 22, 8, 'F')
          // Vector N, matching the SVG monogram; no rasterisation.
          pdf.setFillColor('#d8c7aa')
          pdf.rect(178.5, 18.75, 1.75, 6.5, 'F')
          pdf.rect(183.75, 18.75, 1.75, 6.5, 'F')
          pdf.triangle(180.25, 18.75, 185.5, 25.25, 183.75, 25.25, 'F')
          pdf.triangle(180.25, 18.75, 178.5, 18.75, 183.75, 25.25, 'F')
        }
      }
      font(7)
      const returned = wrap([layout.senderName, layout.senderStreet, `${layout.senderPostalCode} ${layout.senderCity}`].filter(x => x.trim()).join(' · '), 80)
      if (returned.length > 2) throw new Error('Die Rücksendeangabe ist zu lang. Bitte kürze die Absenderangaben.')
      drawLines(returned, 25, 57, 3)
      font(10)
      const address = [layout.recipientName, layout.recipientStreet, `${layout.recipientPostalCode} ${layout.recipientCity}`].flatMap(value => wrap(value, 80))
      if (address.length > 6) throw new Error('Die Empfängeranschrift ist zu lang für das Anschriftfeld.')
      drawLines(address, 25, 66.2, 4.55)
      if (layout.showInformation !== false) {
        let infoY = 52.4
        const align = layout.informationAlign ?? 'left'
        const x = align === 'right' ? 190 : align === 'center' ? 157.5 : 125
        for (const [label, value] of [['Unser Zeichen', layout.reference], ['Telefon', layout.senderPhone], ['E-Mail', layout.senderEmail], ['Datum', `${layout.city ? `${layout.city}, ` : ''}${formatDate(layout.date)}`]]) {
          if (!value) continue
          font(6.5); pdf.setTextColor('#777469'); pdf.text(label!, x, infoY, { align })
          font(8); pdf.setTextColor('#171715')
          const lines = wrap(value, 65)
          lines.forEach((line, index) => pdf.text(line, x, infoY + 3.7 * (index + 1), { align }))
          infoY += 3.7 * (lines.length + 1) + 2
        }
        if (infoY > 92) throw new Error('Der Informationsblock ist zu lang. Bitte kürze Referenz oder Kontaktdaten.')
      }
    } else {
      font(8, true); pdf.text(layout.senderName, 25, 18)
      if (layout.showInformation !== false) { font(8); pdf.text(`${formatDate(layout.date)} · ${layout.reference}`, 190, 18, { align: 'right' }) }
    }
    let y = page.first ? 102 : 34
    if (page.first) {
      font(11, true); y = drawFormatted(subject, y) + lineHeight * 2
      font(); y = drawFormatted(salutation, y) + lineHeight
    }
    font(); y = drawFormatted(page.lines, y)
    if (page.last) {
      y += lineHeight
      if (closingText.length) y = drawFormatted(closingText, y) + lineHeight
      y = drawFormatted(closing, y)
      if (layout.signatureImage) {
        y += drawImage(layout.signatureImage, y, 'signature')
      }
      drawFormatted(signature, y + lineHeight * 2)
    }
    if (layout.showFoldMarks) {
      pdf.setDrawColor('#777469'); pdf.setLineWidth(.2)
      pdf.line(5, 105, 10, 105); pdf.line(5, 210, 10, 210); pdf.line(5, 148.5, 12, 148.5)
    }
    font(7); pdf.setTextColor('#777469')
    const footer = wrap(layout.footer, 145)
    const footerY = 284 - (footer.length - 1) * 3.5
    if (layout.design !== 'minimal') {
      pdf.setDrawColor(layout.design === 'line' ? '#bda783' : '#d8d4ca'); pdf.setLineWidth(.2); pdf.line(25, footerY - 4, 190, footerY - 4)
    }
    drawLines(footer, 25, footerY, 3.5)
    pdf.text(`${index + 1} / ${totalPages}`, 190, footerY, { align: 'right' })
  }
  annexes.forEach((page, index) => {
    pdf.addPage()
    pdf.setTextColor('#171715')
    font(9)
    pdf.text(`Anlage ${page.number}${page.continued ? ' · Fortsetzung' : ''}`, 25, 20)
    font(14, true)
    drawLines(page.title, 25, 31)
    font()
    let bodyY = 36 + page.title.length * lineHeight
    if (page.image) {
      bodyY += drawImage(page.image, bodyY - 4, 'attachment') + 4
    }
    drawFormatted(page.lines, bodyY)
    font(7)
    pdf.text(`${pages.length + index + 1} / ${totalPages}`, 190, 284, { align: 'right' })
  })
  return pdf
}
