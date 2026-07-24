import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchStudiedWords, todayIn, type StudiedWord } from '../lib/api'
import { useAuth } from '../store/auth'
import { speak } from '../lib/audio'
import { Skeleton } from '../components/Skeleton'
import { PixelIcon } from '../components/PixelIcon'
import { PosBadge } from '../components/PosBadge'

const DAY_LABELS = ['Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb', 'Mg']

const pad = (n: number) => String(n).padStart(2, '0')
const keyOf = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`

// Kunci tanggal lokal "YYYY-MM-DD" — format yang sama dengan keyOf(), jadi
// pencocokan kalender cukup perbandingan string dan bebas geser timezone.
function groupByDate(words: StudiedWord[], tz: string) {
  const keyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: tz })
  const map = new Map<string, StudiedWord[]>()
  for (const w of words) {
    const key = keyFmt.format(new Date(w.last_reviewed))
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(w)
  }
  return map
}

/** Petak satu bulan, Senin di kolom pertama. null = sel kosong sebelum tgl 1. */
export function monthCells(y: number, m: number): (number | null)[] {
  const firstWeekday = (new Date(y, m, 1).getDay() + 6) % 7 // getDay(): 0 = Minggu
  const days = new Date(y, m + 1, 0).getDate() // hari ke-0 bulan depan = hari terakhir bulan ini
  return [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ]
}

/** "3 hari lagi", "hari ini", "telat 2 hari" — jarak hari dari due_date ke
 *  hari ini. Keduanya YYYY-MM-DD, jadi selisihnya dihitung di UTC dan bebas DST. */
function dueLabel(due: string, today: string): string {
  const day = 86_400_000
  const diff = Math.round((Date.parse(due + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / day)
  if (diff < -1) return `telat ${-diff} hari`
  if (diff === -1) return 'telat 1 hari'
  if (diff === 0) return 'hari ini'
  if (diff === 1) return 'besok'
  return `${diff} hari lagi`
}

export default function Vocabulary() {
  const profile = useAuth((s) => s.profile)
  const [words, setWords] = useState<StudiedWord[] | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return { y: d.getFullYear(), m: d.getMonth() }
  })

  useEffect(() => {
    if (!profile) return
    fetchStudiedWords().then(setWords).catch(() => setWords([]))
  }, [profile])

  const byDate = useMemo(
    () => (words && profile ? groupByDate(words, profile.timezone) : null),
    [words, profile],
  )

  // Buka otomatis di hari terakhir yang ada katanya — layar tidak pernah kosong.
  useEffect(() => {
    if (!byDate || byDate.size === 0 || selected) return
    const keys = [...byDate.keys()].sort()
    const latest = keys[keys.length - 1]
    const [y, m] = latest.split('-').map(Number)
    setSelected(latest)
    setCursor({ y, m: m - 1 })
  }, [byDate, selected])

  function shiftMonth(by: number) {
    setCursor(({ y, m }) => {
      const next = m + by
      return { y: y + Math.floor(next / 12), m: ((next % 12) + 12) % 12 }
    })
  }

  if (!profile || !words || !byDate) return (
    <div className="animate-fade-up space-y-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-72 w-full" />
    </div>
  )

  if (words.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <PixelIcon name="book" size={64} className="animate-bob" />
        <h1 className="text-xl font-extrabold">Belum ada kata yang dipelajari</h1>
        <p className="muted">Mulai sesi belajar untuk mengisi kosakatamu.</p>
        <Link to="/belajar" className="btn-primary mt-2 block text-center">Mulai belajar</Link>
      </div>
    )
  }

  const mastered = words.filter((w) => w.status === 'mastered').length
  const cells = monthCells(cursor.y, cursor.m)
  const monthLabel = new Date(cursor.y, cursor.m, 1)
    .toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  const todayKey = new Intl.DateTimeFormat('en-CA', { timeZone: profile.timezone }).format(new Date())
  const dayWords = selected ? byDate.get(selected) ?? [] : []
  const today = todayIn(profile.timezone)

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Kosakataku</h1>
        <p className="tnum muted">
          {words.length} kata dipelajari · <span className="font-semibold text-brand">{mastered} dikuasai</span>
        </p>
      </div>

      <section className="card space-y-3">
        <div className="flex items-center justify-between gap-2">
          <MonthButton label="Bulan sebelumnya" onClick={() => shiftMonth(-1)}>{'<'}</MonthButton>
          <h2 className="font-pixel text-[11px] leading-relaxed">{monthLabel}</h2>
          <MonthButton label="Bulan berikutnya" onClick={() => shiftMonth(1)}>{'>'}</MonthButton>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {DAY_LABELS.map((d) => (
            <span key={d} className="muted text-[10px] font-bold">{d}</span>
          ))}
          {cells.map((d, i) => {
            if (d === null) return <span key={`pad-${i}`} />
            const key = keyOf(cursor.y, cursor.m, d)
            const count = byDate.get(key)?.length ?? 0
            const isSelected = key === selected
            return (
              <button
                key={key}
                disabled={count === 0}
                onClick={() => setSelected(key)}
                aria-label={`${d} ${monthLabel}, ${count} kata`}
                aria-pressed={isSelected}
                className={`tnum relative flex aspect-square flex-col items-center justify-center gap-1 border-[3px] text-xs font-bold transition-all duration-75 ease-soft
                  focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent
                  ${isSelected
                    ? 'border-accent bg-brand text-ink shadow-pixel-sm'
                    : count > 0
                      ? 'border-ink bg-white text-slate-800 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-pixel-sm dark:border-white/25 dark:bg-slate-800 dark:text-slate-100'
                      : `border-transparent text-slate-400 dark:text-slate-500 ${key === todayKey ? '!border-dashed !border-ink/50 dark:!border-white/40' : ''}`}`}
              >
                {d}
                {/* Penanda "ada kata": balok piksel, bukan angka — angka polos di
                    bawah tanggal terbaca sebagai tanggal kedua. Jumlah persisnya
                    muncul di judul daftar begitu tanggalnya dipilih. */}
                <span
                  className={`h-1 w-3 ${count === 0 ? 'invisible' : isSelected ? 'bg-ink' : 'bg-brand'}`}
                  aria-hidden
                />
              </button>
            )
          })}
        </div>

        <p className="muted flex flex-wrap items-center gap-1.5 text-xs">
          <span className="inline-block h-1 w-3 bg-brand" aria-hidden />
          Tanggal bergaris hijau = ada kata yang kamu latih. Ketuk untuk melihat daftarnya.
        </p>
      </section>

      <section className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-bold">
            {selected
              ? new Date(`${selected}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })
              : 'Pilih tanggal'}
          </h2>
          {/* Jumlah kata pindah ke sini — di dalam sel kalender ia terbaca
              sebagai tanggal, di sini jelas merujuk hari yang dipilih. */}
          <span className="tnum shrink-0 border-[3px] border-ink bg-brand px-2 py-0.5 text-xs font-bold text-ink dark:border-white/25">
            {dayWords.length} kata
          </span>
        </div>

        <p className="muted flex flex-wrap items-center gap-1.5 text-xs">
          <PixelIcon name="check" size={14} /> dikuasai ·
          <PixelIcon name="bookBlue" size={14} /> sedang dipelajari
        </p>

        {dayWords.length === 0 ? (
          <p className="muted py-6 text-center text-sm">
            Tidak ada kata pada tanggal ini. Ketuk kotak berwarna di kalender.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {dayWords.map((w) => (
              <button
                key={w.text} onClick={() => speak(w.text)}
                className="tile flex items-center justify-between !p-3 text-left transition-all duration-75 ease-soft hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-brand active:translate-x-0.5 active:translate-y-0.5 active:shadow-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <span>
                  <span className="font-bold text-brand">{w.text}</span>
                  {w.phonetic && <span className="muted ml-1 text-xs">{w.phonetic}</span>}
                  <span className="muted block text-sm">{w.translation_id}</span>
                  <span className="mt-1 block"><PosBadge pos={w.part_of_speech} /></span>
                  {/* Kata 'mastered' sengaja tidak diberi tanggal: fetchDueCards
                      mengecualikannya, jadi ia memang tak akan muncul lagi. */}
                  <span className="tnum block text-xs font-semibold text-brand">
                    {w.status === 'mastered'
                      ? 'selesai — tak dijadwalkan ulang'
                      : `review ${dueLabel(w.due_date, today)}`}
                  </span>
                </span>
                <span title={w.status === 'mastered' ? 'dikuasai' : 'sedang dipelajari'}>
                  <PixelIcon name={w.status === 'mastered' ? 'check' : 'bookBlue'} size={18} />
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function MonthButton({ label, onClick, children }: {
  label: string; onClick: () => void; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick} aria-label={label}
      className="border-[3px] border-ink px-3 py-1.5 font-pixel text-[11px] shadow-pixel-sm transition-all duration-75 ease-soft hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none dark:border-white/25 dark:shadow-[2px_2px_0_0_#141E3C] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {children}
    </button>
  )
}
