import { describe, expect, it } from 'vitest'
import { buildTemplate, designs, headerStyles, starterTemplates, salutations } from '../app/data/template-presets'
import { layoutFields, previewLayout, previewText, renderLayout } from '../app/utils/template'

describe('reusable templates', () => {
  it('supports every layout/header combination independently of the text preset', () => {
    for (const design of designs) for (const header of headerStyles) {
      const cancellation = buildTemplate({ preset:'cancellation',name:'Meine Kündigung',category:'Verträge',design:design.id,headerStyle:header.id,salutation:salutations[2]!.text,closing:'Viele Grüße' })
      const authority = buildTemplate({ preset:'authorization',name:'Meine Vollmacht',category:'Vollmacht',design:design.id,headerStyle:header.id,salutation:salutations[3]!.text,closing:'Freundliche Grüße' })
      expect(cancellation.layout.design).toBe(authority.layout.design)
      expect(cancellation.layout.headerStyle).toBe(authority.layout.headerStyle)
      expect(cancellation.content).toContain('kündige')
      expect(authority.content).toContain('bevollmächtige')
      expect(cancellation.category).toBe('Verträge')
    }
  })
  it('detects and renders subject/salutation/closing placeholders without mutating defaults', () => {
    const draft = buildTemplate({preset:'cancellation',name:'Kündigung',category:'Kündigung',design:'line',headerStyle:'centered',salutation:'Guten Tag {{Name}},',closing:'{{Abschluss}}',closingText:'Antwort bitte über {{Antwortweg}}.'})
    expect(layoutFields(draft.layout)).toContain('Name')
    expect(layoutFields(draft.layout)).toContain('Vertragsnummer')
    const rendered = renderLayout(draft.layout,{Name:'Alex',Vertragsnummer:'A-123',Abschluss:'Viele Grüße',Antwortweg:'E-Mail'})
    expect(rendered.salutation).toBe('Guten Tag Alex,')
    expect(rendered.subject).toContain('A-123')
    expect(draft.layout.salutation).toContain('{{Name}}')
    expect(rendered.design).toBe('line')
    expect(rendered.closingText).toBe('Antwort bitte über E-Mail.')
  })
  it('updates known values live in the letter and attached form without requiring the remaining fields', () => {
    const draft = starterTemplates()[0]!
    draft.layout.salutation = 'Guten Tag {{Name}},'
    draft.layout.attachments = [{ id: 'agb', title: 'Vertrag {{Vertragsnummer}}', content: 'Für {{Name}} ab {{Datum}}' }]
    const values = { Name: 'Alex', Vertragsnummer: 'A-123' }
    expect(previewText(draft.content, values)).toContain('A-123')
    expect(previewText(draft.content, values)).toContain('{{Kündigungsdatum}}')
    const layout = previewLayout(draft.layout, values)
    expect(layout.salutation).toBe('Guten Tag Alex,')
    expect(layout.attachments?.[0]).toMatchObject({ title: 'Vertrag A-123', content: 'Für Alex ab {{Datum}}' })
    expect(draft.layout.salutation).toBe('Guten Tag {{Name}},')
  })
  it('creates independent starter copies with categories', () => {
    const first = starterTemplates()
    first[0]!.layout.design = 'minimal'
    expect(starterTemplates()[0]!.layout.design).toBe('classic')
    expect(first.map(item => item.category)).toContain('Vollmacht')
    expect(first.every(item => item.id.startsWith('starter:'))).toBe(true)
  })
})
