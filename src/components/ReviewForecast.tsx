import { useEffect, useState } from 'react'
import { fetchReviewForecast, todayIn, type ReviewForecast as Forecast } from '../lib/api'
import { useAuth } from '../store/auth'
import { Skeleton } from './Skeleton'

// Interval SRS melompat 1 → 6 → 15 → 37 hari, jadi grafik HARIAN hampir selalu
// kosong: satu batang di antara belasan kolom nol. Dikelompokkan per rentang,
// batangnya terisi dan langsung menjawab "seberapa berat minggu ini".
//
// span 15 dipilih supaya days[0..14] = selisih 0..14 hari dan `beyond` = 15 hari
// ke atas — persis batas kelompok di bawah, jadi bucketDueDates dipakai apa
// adanya tanpa logika tanggal baru.
const SPAN = 15

const GROUPS: { label: string; from: number; to: number }[] = [
  { label: 'Hari ini', from: 0, to: 0 },
  { label: 'Besok', from: 1, to: 1 },
  { label: '2–3 hari', from: 2, to: 3 },
  { label: '4–7 hari', from: 4, to: 7 },
  { label: '1–2 minggu', from: 8, to: 14 },
]

/** Jumlahkan hari-hari ke dalam kelompok. Dipisah & diuji karena kalau GROUPS
 *  tidak menutup seluruh indeks days[], kartu akan hilang diam-diam dari grafik. */
export function groupForecast(days: { count: number }[], beyond: number) {
  return [
    ...GROUPS.map((g) => ({
      label: g.label,
      count: days.slice(g.from, g.to + 1).reduce((n, d) => n + d.count, 0),
    })),
    { label: '> 2 minggu', count: beyond },
  ]
}

export default function ReviewForecast() {
  const profile = useAuth((s) => s.profile)
  const [data, setData] = useState<Forecast | null>(null)

  useEffect(() => {
    if (!profile) return
    fetchReviewForecast(todayIn(profile.timezone), SPAN).then(setData).catch(() => setData(null))
  }, [profile])

  if (!profile) return null
  if (!data) return <Skeleton className="h-56 w-full" />

  const rows = groupForecast(data.days, data.beyond)
  const max = Math.max(1, ...rows.map((r) => r.count))
  const soon = rows[0].count + rows[1].count // hari ini + besok

  return (
    <section className="card space-y-4">
      <div>
        <h2 className="font-bold">Jadwal review</h2>
        <p className="muted text-sm">
          Kapan kata-katamu akan muncul lagi untuk diulang.
        </p>
      </div>

      {data.overdue > 0 && (
        <p className="tnum border-[3px] border-ink bg-coral px-3 py-2 text-sm font-bold text-white dark:border-white/25">
          {data.overdue} kata sudah lewat jadwal — kerjakan dulu, ya.
        </p>
      )}

      {data.scheduled === 0 ? (
        <p className="muted py-4 text-center text-sm">
          Belum ada kata yang dijadwalkan. Mulai sesi belajar dulu.
        </p>
      ) : (
        <>
          {/* Batang horizontal: label rentang butuh ruang baca, dan hanya ada
              enam baris — nilainya dilabeli semua, bukan disembunyikan. */}
          <div
            className="space-y-2"
            role="img"
            aria-label={
              `Jadwal review: ${rows.map((r) => `${r.label} ${r.count} kata`).join(', ')}.`
            }
          >
            {rows.map((r, i) => (
              <div key={r.label} className="flex items-center gap-2">
                <span className={`w-20 shrink-0 text-xs ${i < 2 ? 'font-bold' : 'muted'}`}>
                  {r.label}
                </span>
                <div className="bar h-5 flex-1">
                  <div
                    className="h-full bg-brand transition-[width] duration-500 ease-pixel"
                    // Hitungan 1 harus tetap terlihat, jadi ada lebar minimum.
                    style={{ width: r.count === 0 ? 0 : `max(6px, ${(r.count / max) * 100}%)` }}
                  />
                </div>
                <span className="tnum w-6 shrink-0 text-right text-xs font-bold">{r.count}</span>
              </div>
            ))}
          </div>

          <p className="muted text-xs">
            {soon > 0
              ? `${soon} kata menunggu dalam dua hari ke depan · ${data.scheduled} kata masih dijadwalkan.`
              : `Tidak ada yang jatuh tempo sampai besok · ${data.scheduled} kata masih dijadwalkan.`}
          </p>
        </>
      )}
    </section>
  )
}
