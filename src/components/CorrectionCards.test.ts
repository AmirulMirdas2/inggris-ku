import { describe, it, expect } from 'vitest'
import { syncCards, type CorrectionCard } from './CorrectionCards'

describe('syncCards', () => {
  it('percobaan pertama: semua kesalahan jadi kartu aktif', () => {
    const cards = syncCards([], [
      { aspek: 'tense', pesan: 'a' },
      { aspek: 'kata-kerja', pesan: 'b' },
    ])
    expect(cards.map((c) => [c.aspek, c.fixed])).toEqual([['tense', false], ['kata-kerja', false]])
  })

  it('kesalahan yang hilang dicoret, yang tetap diperbarui', () => {
    const prev: CorrectionCard[] = [
      { aspek: 'tense', pesan: 'a', fixed: false },
      { aspek: 'kata-kerja', pesan: 'b', fixed: false },
    ]
    const next = syncCards(prev, [{ aspek: 'kata-kerja', pesan: 'b2' }])
    expect(next.find((c) => c.aspek === 'tense')!.fixed).toBe(true)   // beres
    const kk = next.find((c) => c.aspek === 'kata-kerja')!
    expect(kk.fixed).toBe(false)
    expect(kk.pesan).toBe('b2')                                        // pesan diperbarui
  })

  it('kesalahan baru pada kalimat perbaikan ditambah sebagai kartu', () => {
    const prev: CorrectionCard[] = [{ aspek: 'tense', pesan: 'a', fixed: false }]
    const next = syncCards(prev, [{ aspek: 'artikel', pesan: 'c' }])
    expect(next.map((c) => c.aspek)).toEqual(['tense', 'artikel'])
    expect(next.find((c) => c.aspek === 'tense')!.fixed).toBe(true)   // lama beres
    expect(next.find((c) => c.aspek === 'artikel')!.fixed).toBe(false) // baru muncul
  })

  it('semua benar → semua kartu tercoret', () => {
    const prev: CorrectionCard[] = [
      { aspek: 'tense', pesan: 'a', fixed: false },
      { aspek: 'artikel', pesan: 'c', fixed: false },
    ]
    expect(syncCards(prev, []).every((c) => c.fixed)).toBe(true)
  })
})
