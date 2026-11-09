import { formatLines, wrapText } from './letter-format'
import { imageGeometry } from './letter-geometry'
import type { LetterDraft, LetterPageData, LetterLayout, TextBlockFormat } from '~/types/document'

export function createDraft(): LetterDraft {
  const today = new Date()
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return {
    name: 'Terminbestätigung', category: 'Allgemeines', type: 'Letter',
    content: `vielen Dank für das freundliche Gespräch. Gerne bestätigen wir Ihnen den vereinbarten Termin am {{Datum}} um {{Uhrzeit}}.

Wir freuen uns darauf, die nächsten Schritte gemeinsam mit Ihnen zu besprechen. Sollten Sie vorab Fragen haben, sind wir jederzeit gerne für Sie da.`,
    layout: {
      design: 'classic', headerStyle: 'standard',
      senderName: 'Nitoh Studio', senderStreet: 'Musterstraße 12', senderPostalCode: '10115', senderCity: 'Berlin',
      senderEmail: 'hallo@example.com', senderPhone: '+49 30 123456',
      recipientName: 'Erika Musterfrau', recipientStreet: 'Beispielweg 8', recipientPostalCode: '20095', recipientCity: 'Hamburg',
      subject: 'Bestätigung unseres gemeinsamen Termins', salutation: 'Sehr geehrte Frau Musterfrau,',
      closingText: '', closing: 'Mit freundlichen Grüßen', signature: 'Max Mustermann', city: 'Berlin', date,
      reference: 'NT-2026-001', footer: '', showLogo: true, showFoldMarks: true
    }
  }
}
export function formatDate(value: string): string {
  const parts = value.split('-')
  return parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : value
}
export function paginateLines<T>(lines: T[], firstCapacity = 25, nextCapacity = 43, closingLines = 6): LetterPageData<T>[] {
  const pages: LetterPageData<T>[] = []
  const remaining = [...lines]
  do {
    const capacity = pages.length === 0 ? firstCapacity : nextCapacity
    if (remaining.length + closingLines <= capacity) {
      pages.push({ lines: remaining.splice(0), first: pages.length === 0, last: true })
    } else {
      const count = Math.min(capacity, remaining.length)
      pages.push({ lines: remaining.splice(0, count), first: pages.length === 0, last: false })
      if (!remaining.length) pages.push({ lines: [], first: false, last: true })
    }
  } while (remaining.length)
  return pages
}

export function attachmentPages(
  attachments: NonNullable<LetterLayout['attachments']>,
  measure: (text: string) => number,
  width: number,
  measureFormat: (text: string, format: TextBlockFormat) => number = (text: string) => measure(text) * 165 / width
) {
  return attachments.flatMap((item, index) => {
    const lines = formatLines(item.content, item.textFormat, measureFormat)
    const title = wrapText(item.title, measure, width * 0.78)
    const pages = []
    let offset = 0
    do {
      const image = offset === 0 ? item.image : null
      const geometry = image ? imageGeometry(image, 'attachment') : null
      const capacity = Math.max(1, 42 - title.length - (geometry ? Math.ceil((geometry.height + geometry.y + 4) / 5.29) : 0))
      pages.push({ number: index + 1, title, continued: offset > 0, lines: lines.slice(offset, offset + capacity), image })
      offset += capacity
    } while (offset < lines.length)
    return pages
  })
}
