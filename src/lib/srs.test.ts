import { describe, it, expect } from 'vitest'
import { schedule, qualityFrom, addDays, bucketDueDates } from './srs'

const TODAY = '2026-01-01'

describe('schedule', () => {
  it('kata gagal (q<3) diulang besok, repetitions reset', () => {
    const r = schedule({ ease_factor: 2.5, interval_days: 10, repetitions: 3 }, 1, TODAY)
    expect(r.interval_days).toBe(1)
    expect(r.repetitions).toBe(0)
    expect(r.due_date).toBe('2026-01-02')
    expect(r.status).toBe('learning')
  })

  it('interval melebar: 1 → 6 → EF*interval', () => {
    const a = schedule(undefined, 5, TODAY)
    expect(a.interval_days).toBe(1)
    expect(a.repetitions).toBe(1)

    const b = schedule(a, 5, TODAY)
    expect(b.interval_days).toBe(6)
    expect(b.repetitions).toBe(2)

    const c = schedule(b, 5, TODAY)
    expect(c.interval_days).toBe(Math.round(6 * b.ease_factor))
    expect(c.repetitions).toBe(3)
  })

  it('ease_factor tidak turun di bawah 1.3', () => {
    let s = { ease_factor: 1.3, interval_days: 1, repetitions: 0 }
    for (let i = 0; i < 5; i++) s = schedule(s, 0, TODAY)
    expect(s.ease_factor).toBeGreaterThanOrEqual(1.3)
  })

  it('jadi mastered setelah 3 sukses berturut', () => {
    let s = schedule(undefined, 5, TODAY)
    s = schedule(s, 5, TODAY)
    s = schedule(s, 5, TODAY)
    expect(s.status).toBe('mastered')
    expect(s.repetitions).toBeGreaterThanOrEqual(3)
    expect(s.ease_factor).toBeGreaterThanOrEqual(2.3)
  })
})

describe('qualityFrom', () => {
  it('benar tanpa bantuan = 5, dengan bantuan = 3, salah = 1', () => {
    expect(qualityFrom(true, false)).toBe(5)
    expect(qualityFrom(true, true)).toBe(3)
    expect(qualityFrom(false, false)).toBe(1)
  })
})

describe('addDays', () => {
  it('melewati batas bulan, tahun, dan tahun kabisat', () => {
    expect(addDays('2026-07-30', 3)).toBe('2026-08-02')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29') // kabisat
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01') // bukan kabisat
  })
})

describe('bucketDueDates', () => {
  const today = '2026-07-18'

  it('memisah terlambat / dalam rentang / di luar rentang', () => {
    const b = bucketDueDates(
      ['2026-07-10', '2026-07-17', '2026-07-18', '2026-07-18', '2026-07-20', '2026-08-15'],
      today, 14,
    )
    expect(b.overdue).toBe(2)
    expect(b.beyond).toBe(1)
    expect(b.days).toHaveLength(14)
    expect(b.days[0]).toEqual({ date: today, count: 2 }) // kolom pertama = hari ini
    expect(b.days[2].count).toBe(1)
  })

  it('hari terakhir rentang bersifat inklusif', () => {
    const b = bucketDueDates(['2026-07-31'], today, 14)
    expect(b.days[13].date).toBe('2026-07-31')
    expect(b.days[13].count).toBe(1)
    expect(b.beyond).toBe(0)
  })

  it('tidak ada kartu yang hilang atau terhitung dobel', () => {
    const dues = ['2026-07-01', '2026-07-18', '2026-07-25', '2026-09-01', '2026-07-19']
    const b = bucketDueDates(dues, today, 14)
    const total = b.overdue + b.beyond + b.days.reduce((n, d) => n + d.count, 0)
    expect(total).toBe(dues.length)
  })
})
