export type DocumentType = 'Letter' | 'Invoice' | 'Reminder'
export type LetterDesign = 'classic' | 'minimal' | 'line'
export type HeaderStyle = 'standard' | 'compact' | 'centered'
export type BlockAlignment = 'left' | 'center' | 'right'
export interface TextBlockFormat {
  align: BlockAlignment; indent: number; tabs: number; before: number; bold: boolean; italic: boolean
  rightIndent?: number; after?: number; underline?: boolean
}
export type LetterSection = 'subject' | 'salutation' | 'closingText' | 'closing' | 'signature'
export interface ImagePlacement { align: BlockAlignment; x: number; y: number; width: number; tabs: number }
export interface LetterImage { data: string; width: number; height: number; placement?: ImagePlacement }
export interface LetterAttachment { id: string; title: string; content: string; category?: string; textFormat?: TextBlockFormat | null; image?: LetterImage | null }
export interface LetterLayout {
  bodyFormats?: (TextBlockFormat | null)[]
  sectionFormats?: Partial<Record<LetterSection, TextBlockFormat>>
  logoImage?: LetterImage | null
  signatureImage?: LetterImage | null
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
export interface LetterPageData<T = string> { lines: T[]; last: boolean; first: boolean }

export interface LibraryImage { id: string; at: string; name: string; category: string; image: LetterImage }
