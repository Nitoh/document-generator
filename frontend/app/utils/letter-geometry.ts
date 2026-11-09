import type { LetterImage } from '~/types/document'

export const tabMm = 12.5
export type ImageRole = 'logo' | 'signature' | 'attachment'
const defaults = {
  logo: { width: 26, height: 22, align: 'right', y: 0, maxY: 10 },
  signature: { width: 50, height: 18, align: 'left', y: 1, maxY: 25 },
  attachment: { width: 55, height: 30, align: 'left', y: 0, maxY: 25 }
} as const
function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min))
}
export function imageGeometry(image: LetterImage, role: ImageRole) {
  const standard = defaults[role]
  const placement = image.placement
  const widthLimit = role === 'logo' ? 45 : 165
  const heightLimit = placement ? role === 'logo' ? 24 : 60 : standard.height
  const ratio = Math.min(clamp(placement?.width ?? standard.width, 4, widthLimit) / image.width, heightLimit / image.height)
  const width = image.width * ratio
  const height = image.height * ratio
  const align = placement?.align ?? standard.align
  const free = 165 - width
  const x = (align === 'right' ? free : align === 'center' ? free / 2 : 0) + (placement?.x ?? 0) + (placement?.tabs ?? 0) * tabMm
  return { width, height, x: clamp(x, 0, free), y: clamp(placement?.y ?? standard.y, 0, Math.min(standard.maxY, role === 'logo' ? 26 - height : standard.maxY)) }
}
