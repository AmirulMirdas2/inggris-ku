// SM-2 disederhanakan (lihat spec bagian 6). Fungsi murni → mudah diuji.
import type { CardStatus } from './types'

export interface SrsState {
  ease_factor: number
  interval_days: number
  repetitions: number
}

export interface SrsResult extends SrsState {
  due_date: string // ISO date (YYYY-MM-DD)
  status: CardStatus
}

const DEFAULT: SrsState = { ease_factor: 2.5, interval_days: 0, repetitions: 0 }

/** Geser tanggal ISO (YYYY-MM-DD) sejumlah hari. Parsing UTC supaya tidak
 *  bergeser sehari di zona waktu manapun. */
export function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Terapkan satu review bermutu `q` (0–5) ke state kartu. */
export function schedule(prev: SrsState = DEFAULT, q: number, today: string): SrsResult {
  let { ease_factor, interval_days, repetitions } = prev

  if (q < 3) {
    repetitions = 0
    interval_days = 1
  } else {
    if (repetitions === 0) interval_days = 1
    else if (repetitions === 1) interval_days = 6
    else interval_days = Math.round(interval_days * ease_factor)
    repetitions += 1
  }

  ease_factor = Math.max(1.3, ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))

  const status: CardStatus = repetitions >= 3 && ease_factor >= 2.3 ? 'mastered' : 'learning'
  return { ease_factor, interval_days, repetitions, due_date: addDays(today, interval_days), status }
}

/** Petakan hasil latihan → mutu 0–5.
 *  benar tanpa bantuan → 5; benar tapi lihat contoh → 3; salah → 1. */
export function qualityFrom(correct: boolean, usedHint: boolean): number {
  if (!correct) return 1
  return usedHint ? 3 : 5
}

export interface ForecastBuckets {
  overdue: number
  days: { date: string; count: number }[]
  beyond: number
}

/** Kelompokkan tanggal jatuh tempo jadi: terlambat / per-hari dalam rentang /
 *  di luar rentang. Murni supaya bisa diuji tanpa jaringan — salah hitung di
 *  sini tidak akan terlihat di layar, cuma angkanya diam-diam keliru. */
export function bucketDueDates(dueDates: string[], today: string, span: number): ForecastBuckets {
  const days = Array.from({ length: span }, (_, i) => ({ date: addDays(today, i), count: 0 }))
  const index = new Map(days.map((d, i) => [d.date, i]))
  let overdue = 0
  let beyond = 0
  for (const due of dueDates) {
    // Format YYYY-MM-DD berurut secara leksikografis, jadi '<' aman.
    if (due < today) overdue++
    else if (index.has(due)) days[index.get(due)!].count++
    else beyond++
  }
  return { overdue, days, beyond }
}
