import { describe, it, expect } from 'vitest'
import { TENSES, tenseByKey, isUnlocked, tenseStage, UNLOCK_AT, MASTER_AT } from './tenses'

describe('konten 16 tense', () => {
  it('tepat 16 tense, order 0..15 unik & berurut', () => {
    expect(TENSES).toHaveLength(16)
    TENSES.forEach((t, i) => expect(t.order).toBe(i))
    expect(new Set(TENSES.map((t) => t.key)).size).toBe(16)
  })

  it('tiap tense punya materi minimum (agar tahap Baca & Kenali tak kosong)', () => {
    for (const t of TENSES) {
      expect(t.key && t.name && t.nameId && t.formula && t.aiLabel).toBeTruthy()
      expect(t.blurb.length).toBeGreaterThan(10)
      expect(t.when.length).toBeGreaterThanOrEqual(2)
      expect(t.examples.length).toBeGreaterThanOrEqual(3)
      expect(t.contrast.length).toBeGreaterThanOrEqual(2)
      expect(t.recognition.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('jawaban soal Kenali hanya sekarang/lampau/depan', () => {
    const valid = new Set(['sekarang', 'lampau', 'depan'])
    for (const t of TENSES) for (const r of t.recognition) expect(valid.has(r.answer)).toBe(true)
  })

  it('tenseByKey menemukan & menolak yang tak ada', () => {
    expect(tenseByKey('presentSimple')?.order).toBe(0)
    expect(tenseByKey('ngaco')).toBeUndefined()
  })
})

describe('unlock & stage', () => {
  it('tense pertama selalu terbuka; berikutnya perlu UNLOCK_AT benar', () => {
    expect(isUnlocked(0, {})).toBe(true)
    expect(isUnlocked(1, {})).toBe(false)
    expect(isUnlocked(1, { presentSimple: { correct_count: UNLOCK_AT - 1 } })).toBe(false)
    expect(isUnlocked(1, { presentSimple: { correct_count: UNLOCK_AT } })).toBe(true)
  })

  it('stage: locked → learning → mastered', () => {
    const first = TENSES[0]
    const second = TENSES[1]
    expect(tenseStage(second, {})).toBe('locked')
    expect(tenseStage(first, {})).toBe('learning')
    expect(tenseStage(first, { presentSimple: { correct_count: MASTER_AT } })).toBe('mastered')
    // status 'mastered' eksplisit juga dihitung walau count di bawah 50 (mis. sudah lama)
    expect(tenseStage(first, { presentSimple: { correct_count: 3, status: 'mastered' } })).toBe('mastered')
  })
})
