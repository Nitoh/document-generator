import type { LetterDraft, LetterPageData } from '~/types/document'

export function createDraft(): LetterDraft {
  const today = new Date()
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return {
    name: 'Terminbestätigung', type: 'Letter',
    content: `vielen Dank für das freundliche Gespräch. Gerne bestätigen wir Ihnen den vereinbarten Termin am {{Datum}} um {{Uhrzeit}}.

Wir freuen uns darauf, die nächsten Schritte gemeinsam mit Ihnen zu besprechen. Sollten Sie vorab Fragen haben, sind wir jederzeit gerne für Sie da.`,
    layout: {
      senderName: 'Nitoh Studio', senderStreet: 'Musterstraße 12', senderPostalCode: '10115', senderCity: 'Berlin',
      senderEmail: 'hallo@example.com', senderPhone: '+49 30 123456',
      recipientName: 'Erika Musterfrau', recipientStreet: 'Beispielweg 8', recipientPostalCode: '20095', recipientCity: 'Hamburg',
      subject: 'Bestätigung unseres gemeinsamen Termins', salutation: 'Sehr geehrte Frau Musterfrau,',
      closing: 'Mit freundlichen Grüßen', signature: 'Max Mustermann', city: 'Berlin', date,
      reference: 'NT-2026-001', footer: '', showLogo: true, showFoldMarks: true
    }
  }
}
export function formatDate(value: string): string {
  const parts = value.split('-')
  return parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : value
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
export function paginateLines(lines: string[], firstCapacity = 25, nextCapacity = 43, closingLines = 6): LetterPageData[] {
  const pages: LetterPageData[] = []
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
