import { expect, it } from 'vitest'
import { archiveDays, isArchived, lettersByMonth } from '../app/utils/studio-archive'
import { imageGeometry } from '../app/utils/letter-geometry'

it('classifies a letter as archived at exactly 90 days', () => {
  const created = '2026-08-01T12:00:00Z'
  const limit = Date.parse(created) + archiveDays * 86_400_000
  expect(isArchived(created, limit - 1)).toBe(false)
  expect(isArchived(created, limit)).toBe(true)
})

it('combines an image alignment, millimetres and tabs while respecting the page bounds', () => {
  const image = { data: '', width: 100, height: 50,
    placement: { align: 'left' as const, width: 50, x: 10, y: 5, tabs: 1 } }
  expect(imageGeometry(image, 'signature')).toEqual({ width: 50, height: 25, x: 22.5, y: 5 })
  expect(imageGeometry({ ...image, placement: { ...image.placement, align: 'right' } }, 'signature').x).toBe(115)
})

it('groups history by the local calendar month and sorts letters newest first', () => {
  const letters = [
    { at: '2026-10-31T22:59:59Z', id: 'october' },
    { at: '2026-10-31T23:00:00Z', id: 'november-first' },
    { at: '2026-11-05T12:00:00Z', id: 'november-latest' }
  ]
  const groups = lettersByMonth(letters, 'Europe/Berlin')
  expect(groups.map(group => [group.label, group.entries.map(letter => letter.id)])).toEqual([
    ['November 2026', ['november-latest', 'november-first']],
    ['Oktober 2026', ['october']]
  ])
})
