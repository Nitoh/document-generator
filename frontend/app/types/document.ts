export type DocumentType = 'Letter' | 'Invoice' | 'Reminder'
export type LetterDesign = 'classic' | 'minimal' | 'line'
export type HeaderStyle = 'standard' | 'compact' | 'centered'
export interface LetterAttachment { id: string; title: string; content: string }
export interface LetterLayout {
  attachments?: LetterAttachment[]
  design: LetterDesign; headerStyle: HeaderStyle
  senderName: string; senderStreet: string; senderPostalCode: string; senderCity: string
  senderEmail: string; senderPhone: string
  recipientName: string; recipientStreet: string; recipientPostalCode: string; recipientCity: string
  subject: string; salutation: string; closingText: string; closing: string; signature: string
  city: string; date: string; reference: string; footer: string
  showLogo: boolean; showFoldMarks: boolean
}
export interface LetterDraft { name: string; category: string; type: DocumentType; content: string; layout: LetterLayout }
export interface DocumentTemplate extends LetterDraft { id: string; createdAt: string }
export interface LetterPageData { lines: string[]; last: boolean; first: boolean }
