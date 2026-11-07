import regularUrl from '~/assets/fonts/Carlito-Regular.ttf?url'
import boldUrl from '~/assets/fonts/Carlito-Bold.ttf?url'
import type { LetterLayout } from '~/types/document'
import type { PdfFonts } from '~/utils/pdf'

let fontPromise: Promise<PdfFonts> | undefined
async function loadFont(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Die Druckschrift konnte nicht geladen werden. Bitte lade die Seite neu.')
  const bytes = new Uint8Array(await response.arrayBuffer())
  let binary = ''
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192))
  return btoa(binary)
}
export function useLetterPdf() {
  const exporting = ref(false)
  async function download(layout: LetterLayout, body: string) {
    exporting.value = true
    try {
      fontPromise ??= Promise.all([loadFont(regularUrl), loadFont(boldUrl)])
        .then(([regular, bold]) => ({ regular, bold }))
        .catch(cause => { fontPromise = undefined; throw cause })
      const [fonts, { createLetterPdf }] = await Promise.all([fontPromise, import('~/utils/pdf')])
      const pdf = createLetterPdf(layout, body, fonts)
      const name = layout.subject.replace(/[^\p{L}\p{N}_-]+/gu, '-').slice(0, 70) || 'Brief'
      pdf.save(`Nitoh-${name}.pdf`)
    } finally { exporting.value = false }
  }
  return { exporting, download }
}
