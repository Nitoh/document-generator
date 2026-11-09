import type { DocumentTemplate, LetterAttachment, LetterLayout, LibraryImage } from '~/types/document'

export type Version =
  | { id: string; at: string; kind: 'template'; item: DocumentTemplate }
  | { id: string; at: string; kind: 'form'; item: LetterAttachment }
export interface TemplateOrigin { name: string; version?: number; revisionId?: string }
export interface HistoryEntry { id: string; at: string; layout: LetterLayout; body: string; origin?: TemplateOrigin }
export interface ArchivedLetter {
  id: string; at: string; subject: string; recipient: string; origin?: TemplateOrigin
  parts: { layout: string; body: string; logo?: string; signature?: string; attachments: string[] }
}
export type LetterRecord = HistoryEntry | ArchivedLetter
export const archiveDays = 90
export function isArchived(at: string, now = Date.now()) {
  return now - Date.parse(at) >= archiveDays * 86_400_000
}
type Archive = { versions: Version; letters: LetterRecord; images: LibraryImage }

function openArchive(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('nitoh.studio-archive', 2)
    request.onupgradeneeded = event => {
      if (event.oldVersion < 1) {
        request.result.createObjectStore('versions', { keyPath: 'id' })
        request.result.createObjectStore('letters', { keyPath: 'id' })
      }
      request.result.createObjectStore('images', { keyPath: 'id' })
      request.result.createObjectStore('parts')
    }
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}
export async function archiveEntries<K extends keyof Archive>(store: K): Promise<Archive[K][]> {
  const db = await openArchive()
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction(store).objectStore(store).getAll()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result.sort((a, b) => b.at.localeCompare(a.at)))
    })
  } finally { db.close() }
}
export async function archiveEntry<K extends keyof Archive>(store: K, item: Archive[K]): Promise<void> {
  const db = await openArchive()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite')
      tx.oncomplete = () => resolve()
      tx.onabort = () => reject(tx.error)
      tx.objectStore(store).put(JSON.parse(JSON.stringify(item)))
    })
  } finally { db.close() }
}

export async function saveLetter(entry: HistoryEntry): Promise<ArchivedLetter> {
  const values = new Map<string, string>()
  async function part(value: unknown): Promise<string> {
    const serialized = JSON.stringify(value)
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(serialized))
    const id = Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('')
    values.set(id, serialized)
    return id
  }
  const { logoImage, signatureImage, attachments, ...layout } = entry.layout
  const [layoutId, body, logo, signature, attachmentIds] = await Promise.all([
    part(layout), part(entry.body), logoImage ? part(logoImage) : undefined,
    signatureImage ? part(signatureImage) : undefined, Promise.all((attachments ?? []).map(part))
  ])
  const record: ArchivedLetter = {
    id: entry.id, at: entry.at, subject: layout.subject, recipient: layout.recipientName, origin: entry.origin,
    parts: { layout: layoutId, body, logo, signature, attachments: attachmentIds }
  }
  const db = await openArchive()
  try {
    return await new Promise<ArchivedLetter>((resolve, reject) => {
      const tx = db.transaction(['letters', 'parts'], 'readwrite')
      const letters = tx.objectStore('letters')
      const stored = letters.get(entry.id)
      stored.onsuccess = () => {
        if (stored.result) {
          const existing = stored.result as LetterRecord
          if ('parts' in existing && JSON.stringify(existing.parts) === JSON.stringify(record.parts)) {
            tx.oncomplete = () => resolve(existing)
            return
          }
          record.id = crypto.randomUUID()
        }
        const parts = tx.objectStore('parts')
        for (const [key, value] of values) parts.put(value, key)
        letters.add(JSON.parse(JSON.stringify(record)))
      }
      tx.oncomplete = () => resolve(record)
      tx.onabort = () => reject(tx.error)
    })
  } finally { db.close() }
}

export async function openLetter(record: LetterRecord): Promise<HistoryEntry> {
  if (!('parts' in record)) return record
  const db = await openArchive()
  try {
    const parts = db.transaction('parts').objectStore('parts')
    function read<T>(id: string): Promise<T> {
      return new Promise((resolve, reject) => {
        const request = parts.get(id)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          try { resolve(JSON.parse(request.result)) }
          catch { reject(new Error('Ein gespeicherter Briefbestandteil fehlt.')) }
        }
      })
    }
    const [layout, body, logoImage, signatureImage, attachments] = await Promise.all([
      read<LetterLayout>(record.parts.layout), read<string>(record.parts.body),
      record.parts.logo ? read<LetterLayout['logoImage']>(record.parts.logo) : undefined,
      record.parts.signature ? read<LetterLayout['signatureImage']>(record.parts.signature) : undefined,
      Promise.all(record.parts.attachments.map(read<LetterAttachment>))
    ])
    return { id: record.id, at: record.at, origin: record.origin, body, layout: { ...layout, logoImage, signatureImage, attachments } }
  } finally { db.close() }
}
