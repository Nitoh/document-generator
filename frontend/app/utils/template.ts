import type { LetterLayout } from '~/types/document'
const pattern = /\{\{\s*([\p{L}_][\p{L}\p{N}_]*)\s*\}\}/gu
export function templateFields(text: string): string[] {
  return [...new Set([...text.matchAll(pattern)].map(match => match[1]!))]
}
export function validateTemplate(text: string): void {
  if (!text.trim() || text.length > 20000) throw new Error('Der Brieftext muss 1 bis 20.000 Zeichen enthalten.')
  if (text.replace(pattern, '').includes('{{') || text.replace(pattern, '').includes('}}')) throw new Error('Ungültiger Platzhalter. Verwende beispielsweise {{Name}}.')
}
export function renderTemplate(text: string, values: Record<string, string>): string {
  validateTemplate(text)
  const missing = templateFields(text).filter(key => !Object.hasOwn(values, key) || !values[key]?.trim())
  if (missing.length) throw new Error(`Bitte ausfüllen: ${missing.join(', ')}`)
  if (Object.values(values).some(value => value.length > 5000)) throw new Error('Ein Wert darf höchstens 5.000 Zeichen enthalten.')
  const output = text.replace(pattern, (_, key: string) => values[key]!)
  if (output.length > 1000000) throw new Error('Das Dokument ist zu groß.')
  return output
}

export const layoutTextKeys = ['senderName', 'senderStreet', 'senderPostalCode', 'senderCity', 'senderEmail', 'senderPhone', 'recipientName', 'recipientStreet', 'recipientPostalCode', 'recipientCity', 'subject', 'salutation', 'closingText', 'closing', 'signature', 'city', 'date', 'reference', 'footer'] as const
export function layoutFields(layout: LetterLayout): string[] {
  return [...new Set([
    ...layoutTextKeys.flatMap(key => templateFields(layout[key])),
    ...(layout.attachments ?? []).flatMap(item => [...templateFields(item.title), ...templateFields(item.content)])
  ])]
}
const layoutLimits: Record<typeof layoutTextKeys[number], number> = {
  senderName:120,senderStreet:120,senderPostalCode:20,senderCity:80,senderEmail:120,senderPhone:50,
  recipientName:160,recipientStreet:120,recipientPostalCode:20,recipientCity:80,
  subject:180,salutation:160,closingText:600,closing:100,signature:120,city:80,date:10,reference:60,footer:200
}
export function renderLayout(layout: LetterLayout, values: Record<string, string>): LetterLayout {
  const rendered = { ...layout }
  for (const key of layoutTextKeys) {
    if (layout[key].trim()) rendered[key] = renderTemplate(layout[key], values)
    if (rendered[key].length > layoutLimits[key]) throw new Error('Die eingesetzten Angaben sind für das gewählte Brieffeld zu lang.')
  }
  rendered.attachments = (layout.attachments ?? []).map(item => {
    const title = renderTemplate(item.title, values)
    const content = renderTemplate(item.content, values)
    if (title.length > 200 || content.length > 20000) throw new Error('Die ausgefüllte Anlage überschreitet die zulässige Länge.')
    return { ...item, title, content }
  })
  return rendered
}
