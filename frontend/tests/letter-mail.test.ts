import { expect, it } from 'vitest'
import { createMailDraft } from '../app/utils/letter-mail'

it('builds a draft message with a MIME PDF attachment and an encoded subject', async () => {
  const pdf = new File(['%PDF-test'], 'Nitoh-Grüße.pdf', { type: 'application/pdf' })
  const draft = await createMailDraft(pdf, 'Grüße', 'test@example.test', 'Meine Nachricht')
  const message = await draft.text()
  expect(message).toContain('To: test@example.test\r\n')
  expect(message).toContain('Subject: =?UTF-8?B?R3LDvMOfZQ==?=')
  expect(message).toContain('X-Unsent: 1')
  expect(message).toContain('Content-Type: application/pdf')
  expect(message).toContain('filename*=UTF-8\'\'Nitoh-Gr%C3%BC%C3%9Fe.pdf')
  expect(message).toContain(btoa('%PDF-test'))
})
