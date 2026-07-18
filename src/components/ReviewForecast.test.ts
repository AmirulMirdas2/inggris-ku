import { describe, it, expect } from 'vitest'
import { bucketDueDates } from '../lib/srs'
import { groupForecast } from './ReviewForecast'

const TODAY = '2026-07-18'
const SPAN = 15 // harus sama dengan SPAN di ReviewForecast

describe('groupForecast', () => {
  it('kelompok menutup SELURUH rentang — tidak ada kartu yang hilang', () => {
    // Satu kartu di setiap selisih hari 0..14, plus satu di luar rentang.
    const days = Array.from({ length: SPAN }, () => ({ count: 1 }))
    const rows = groupForecast(days, 1)
    const total = rows.reduce((n, r) => n + r.count, 0)
    expect(total).toBe(SPAN + 1)
  })

  it('memetakan tiap rentang ke kelompok yang benar', () => {
    const days = Array.from({ length: SPAN }, () => ({ count: 0 }))
    days[0].count = 5   // hari ini
    days[1].count = 3   // besok
    days[3].count = 2   // 2–3 hari
    days[7].count = 4   // 4–7 hari
    days[14].count = 6  // 1–2 minggu (batas atas)
    expect(groupForecast(days, 9)).toEqual([
      { label: 'Hari ini', count: 5 },
      { label: 'Besok', count: 3 },
      { label: '2–3 hari', count: 2 },
      { label: '4–7 hari', count: 4 },
      { label: '1–2 minggu', count: 6 },
      { label: '> 2 minggu', count: 9 },
    ])
  })

  it('menyambung dengan bucketDueDates tanpa kartu tercecer', () => {
    const dues = [
      '2026-07-18', '2026-07-19', '2026-07-19', // hari ini, besok x2
      '2026-07-21', '2026-07-25',               // 2–3 hari, 4–7 hari
      '2026-08-01',                             // 1–2 minggu (selisih 14)
      '2026-09-10',                             // > 2 minggu
      '2026-07-01',                             // terlambat
    ]
    const b = bucketDueDates(dues, TODAY, SPAN)
    const rows = groupForecast(b.days, b.beyond)
    const shown = rows.reduce((n, r) => n + r.count, 0)
    expect(shown + b.overdue).toBe(dues.length)
    expect(rows.map((r) => r.count)).toEqual([1, 2, 1, 1, 1, 1])
  })
})
