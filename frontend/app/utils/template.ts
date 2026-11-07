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
