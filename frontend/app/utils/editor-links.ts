export type PreviewBlock = 'header' | 'recipient' | 'information' | 'subject' | 'salutation' | 'closingText' | 'closing' | 'signature' | 'footer' | 'formTitle' | 'formContent' | `body:${number}`

export function focusEditorField(id: string) {
  const field = document.getElementById(id)
  if (!field) return
  const group = field.closest('.preview-editor-group') ?? field.closest('.form-field') ?? field
  group.scrollIntoView({ block: 'center', behavior: 'instant' })
  field.focus({ preventScroll: true })
  return field
}
