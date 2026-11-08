import type { DocumentTemplate, HeaderStyle, LetterDesign, LetterDraft } from '~/types/document'
import { createDraft } from '~/utils/letter'

export const categories = ['Allgemeines', 'Kündigung', 'Vollmacht', 'Anfragen', 'Bewerbung', 'Sonstiges']
export const designs: { id: LetterDesign; label: string; description: string }[] = [
  { id: 'classic', label: 'Klassisch', description: 'Zeitlos und sachlich.' },
  { id: 'minimal', label: 'Minimal', description: 'Leise Typografie. Viel Klarheit.' },
  { id: 'line', label: 'Linie', description: 'Eine feine sandfarbene Akzentlinie.' }
]
export const headerStyles: { id: HeaderStyle; label: string }[] = [
  { id: 'standard', label: 'Links mit Logo rechts' },
  { id: 'compact', label: 'Kompakter Briefkopf' },
  { id: 'centered', label: 'Zentrierter Briefkopf' }
]
export const salutations = [
  { id: 'unknown', label: 'Unbekannte Empfänger · förmlich', text: 'Sehr geehrte Damen und Herren,' },
  { id: 'male', label: 'Herr · persönlich', text: 'Sehr geehrter Herr {{Nachname}},' },
  { id: 'female', label: 'Frau · persönlich', text: 'Sehr geehrte Frau {{Nachname}},' },
  { id: 'neutral', label: 'Geschlechtsneutral · persönlich', text: 'Guten Tag {{Name}},' },
  { id: 'team', label: 'Team · geschlechtsneutral', text: 'Guten Tag liebes Team,' }
]
export const closingTexts = [
  { id: 'none', label: 'Kein zusätzlicher Abschlussabsatz', text: '' },
  { id: 'reply', label: 'Um Rückmeldung bitten', text: 'Ich freue mich auf Ihre Rückmeldung.' },
  { id: 'thanks', label: 'Für Unterstützung danken', text: 'Vielen Dank für Ihre Unterstützung.' },
  { id: 'contact', label: 'Für Rückfragen anbieten', text: 'Bei Fragen stehe ich Ihnen gerne zur Verfügung.' }
]
export const closings = [
  { id: 'formal', label: 'Mit freundlichen Grüßen', text: 'Mit freundlichen Grüßen' },
  { id: 'kind', label: 'Freundliche Grüße', text: 'Freundliche Grüße' },
  { id: 'personal', label: 'Viele Grüße', text: 'Viele Grüße' },
  { id: 'thanks', label: 'Mit Dank und freundlichen Grüßen', text: 'Mit Dank und freundlichen Grüßen' }
]
export const textPresets = [
  { id: 'blank', name: 'Eigene Briefvorlage', category: 'Allgemeines', subject: 'Mein Betreff', content: `Hier beginnt dein Brieftext. Wiederkehrende Angaben kannst du mit {{Platzhalter}} einsetzen.` },
  { id: 'cancellation', name: 'Kündigung', category: 'Kündigung', subject: 'Kündigung meines Vertrags – {{Vertragsnummer}}', content: `hiermit kündige ich meinen Vertrag mit der Vertragsnummer {{Vertragsnummer}} zum {{Kündigungsdatum}}.

Bitte bestätigen Sie mir die Kündigung sowie das Vertragsende schriftlich.

Vielen Dank.` },
  { id: 'authorization', name: 'Vollmacht', category: 'Vollmacht', subject: 'Vollmacht für {{Angelegenheit}}', content: `hiermit bevollmächtige ich {{BevollmächtigtePerson}}, mich in folgender Angelegenheit zu vertreten:

{{Angelegenheit}}

Diese Vollmacht gilt bis zum {{GültigBis}}.` },
  { id: 'request', name: 'Allgemeine Anfrage', category: 'Anfragen', subject: 'Anfrage zu {{Thema}}', content: `ich möchte mich gerne zu folgendem Thema informieren: {{Thema}}.

{{Anliegen}}

Über eine Rückmeldung freue ich mich. Vielen Dank für Ihre Unterstützung.` }
]
export interface BuilderChoices {
  preset: string; name: string; category: string; design: LetterDesign; headerStyle: HeaderStyle; salutation: string; closing: string; closingText?: string
}
export function buildTemplate(choices: BuilderChoices): LetterDraft {
  const preset = textPresets.find(item => item.id === choices.preset) || textPresets[0]!
  const draft = createDraft()
  return {
    ...draft, name: choices.name.trim(), category: choices.category.trim() || 'Allgemeines', content: preset.content,
    layout: { ...draft.layout, subject: preset.subject, salutation: choices.salutation, closing: choices.closing, closingText: choices.closingText || '', design: choices.design, headerStyle: choices.headerStyle }
  }
}
export function starterTemplates(): DocumentTemplate[] {
  return textPresets.filter(item => item.id !== 'blank').map(preset => ({
    ...buildTemplate({ preset: preset.id, name: preset.name, category: preset.category, design: 'classic', headerStyle: 'standard', salutation: salutations[0]!.text, closing: closings[0]!.text }),
    id: `starter:${preset.id}`, createdAt: ''
  }))
}
