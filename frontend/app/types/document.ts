export type DocumentType = 'Letter' | 'Invoice' | 'Reminder'
export interface LetterLayout {
  senderName: string; senderStreet: string; senderPostalCode: string; senderCity: string
  senderEmail: string; senderPhone: string
  recipientName: string; recipientStreet: string; recipientPostalCode: string; recipientCity: string
  subject: string; salutation: string; closing: string; signature: string
  city: string; date: string; reference: string; footer: string
  showLogo: boolean; showFoldMarks: boolean
}
export interface LetterDraft { name: string; type: DocumentType; content: string; layout: LetterLayout }
export interface DocumentTemplate extends LetterDraft { id: string; createdAt: string }
export interface LetterPageData { lines: string[]; last: boolean; first: boolean }
