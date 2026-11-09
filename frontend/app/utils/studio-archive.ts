import type { DocumentTemplate, LetterAttachment, LetterLayout } from '~/types/document'

export type Version =
  | { id: string; at: string; kind: 'template'; item: DocumentTemplate }
  | { id: string; at: string; kind: 'form'; item: LetterAttachment }
export interface HistoryEntry { id: string; at: string; layout: LetterLayout; body: string }
type Archive = { versions: Version; letters: HistoryEntry }

function openArchive(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('nitoh.studio-archive', 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore('versions', { keyPath: 'id' })
      request.result.createObjectStore('letters', { keyPath: 'id' })
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
