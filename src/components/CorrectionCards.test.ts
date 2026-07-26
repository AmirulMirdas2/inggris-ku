import { describe, it, expect } from 'vitest'
import { syncCards, buildErrors, type CorrectionCard } from './CorrectionCards'
import type { Evaluation } from '../lib/types'

const ev = (over: Partial<Evaluation>): Evaluation => ({
  benar: false, pakaiKataTarget: true, tenseDetected: '', sesuaiTenseTarget: true,
  kalimatKoreksi: '', artiKalimatId: '', penjelasanId: 'ok', bonusTense: false, ...over,
})

describe('buildErrors', () => {
  it('buang kartu kosmetik (kapital & tanda-baca), simpan yang tata bahasa', () => {
    const errs = buildErrors(ev({ koreksiList: [
      { aspek: 'kapital', pesan: 'huruf besar' },
      { aspek: 'tanda-baca', pesan: 'titik' },
      { aspek: 'kata-kerja', pesan: 'butuh is' },
    ] }), 'careful')
    expect(errs.map((e) => e.aspek)).toEqual(['kata-kerja'])
  })
})

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
