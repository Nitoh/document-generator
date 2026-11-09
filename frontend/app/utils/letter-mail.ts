export function downloadFile(file: File) {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function encodeMailBytes(bytes: Uint8Array) {
  let binary = ''
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192))
  }
  return btoa(binary)
}

export async function createMailDraft(pdf: File, subject: string, recipient: string, body: string): Promise<File> {
  const boundary = `nitoh-${crypto.randomUUID()}`
  const text = new TextEncoder()
  const bodyLines = (value: string) => encodeMailBytes(text.encode(value)).match(/.{1,76}/g)?.join('\r\n') ?? ''
  const subjectHeader = subject.match(/.{1,12}/gu)?.map(part => `=?UTF-8?B?${encodeMailBytes(text.encode(part))}?=`).join('\r\n ') ?? ''
  const attachment = encodeMailBytes(new Uint8Array(await pdf.arrayBuffer())).match(/.{1,76}/g)?.join('\r\n')
  const filename = encodeURIComponent(pdf.name).replace(/['()]/g, character => `%${character.charCodeAt(0).toString(16)}`)
  const message = [
    `To: ${recipient.replace(/[\r\n]/g, '')}`, `Subject: ${subjectHeader}`, 'X-Unsent: 1', 'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`, '', `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8', 'Content-Transfer-Encoding: base64', '', bodyLines(body), '',
    `--${boundary}`, 'Content-Type: application/pdf', 'Content-Transfer-Encoding: base64',
    `Content-Disposition: attachment; filename="Brief.pdf"; filename*=UTF-8''${filename}`,
    '', attachment, '', `--${boundary}--`, ''
  ].join('\r\n')
  return new File([message], 'Brief-E-Mail.eml', { type: 'message/rfc822' })
}
