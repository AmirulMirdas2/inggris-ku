import { describe, it, expect } from 'vitest'
import { norm } from './PhaseWrite'

describe('norm (pembanding tulisan hafalan)', () => {
  it('abaikan kapital, spasi ganda, & tanda baca pinggir', () => {
    expect(norm('  Run ') === norm('run')).toBe(true)
    expect(norm('to  eat') === norm('to eat')).toBe(true)
    expect(norm('makan.') === norm('makan')).toBe(true)
  })
  it('beda kata tetap ditolak', () => {
    expect(norm('run') === norm('lari')).toBe(false)
    expect(norm('') === norm('run')).toBe(false)
  })
})
