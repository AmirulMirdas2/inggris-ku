import { useEffect, useState } from 'react'
import { useAuth } from '../store/auth'
import { fetchProgressByWeek, type WeekProgress } from '../lib/api'

const MILESTONES = [
  { at: 10, label: 'Kata pertama dikuasai — awal yang bagus!' },
  { at: 50, label: '50 kata — bisa perkenalan diri' },
  { at: 100, label: '100 kata — kalimat harian sederhana' },
  { at: 250, label: '250 kata — obrolan santai' },
  { at: 500, label: '500 kata — ~80% percakapan warung' },
]

const WEEK_THEME: Record<number, string> = {
  1: 'Kata inti + to be', 2: 'Kegiatan harian', 3: 'Sedang terjadi',
  4: 'Kemarin', 5: 'Nanti',
}

export default function Progress() {
  const profile = useAuth((s) => s.profile)
  const [weeks, setWeeks] = useState<WeekProgress[] | null>(null)

  useEffect(() => { fetchProgressByWeek().then(setWeeks).catch(() => setWeeks([])) }, [])

  if (!profile) return null
  const mastered = profile.words_mastered
  const pct = Math.min(100, Math.round((mastered / 500) * 100))
  const level = mastered >= 300 ? 'A1+' : mastered >= 100 ? 'A1-lite' : 'Pra-A1'

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Progres</h1>

      <div className="card text-center">
        <p className="text-5xl font-extrabold text-brand">{mastered}</p>
        <p className="text-slate-500 dark:text-slate-400">kata dikuasai</p>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-sm text-slate-400">{pct}% dari 500 kata paling sering · perkiraan level {level}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat icon="⭐" value={profile.xp} label="Total XP" />
        <Stat icon="🔥" value={profile.streak_days} label="Streak (hari)" />
      </div>

      {/* Progres per minggu — bar horizontal, satu warna (dikuasai/total) */}
      <div className="card space-y-4">
        <h2 className="font-bold">Progres per minggu</h2>
        {!weeks ? (
          <p className="text-sm text-slate-400">Memuat…</p>
        ) : weeks.length === 0 ? (
          <p className="text-sm text-slate-400">Belum ada data. Mulai belajar dulu, yuk!</p>
        ) : (
          weeks.map((w) => <WeekBar key={w.week} w={w} />)
        )}
      </div>

      <div className="card space-y-3">
        <h2 className="font-bold">Milestone</h2>
        {MILESTONES.map((m) => {
          const done = mastered >= m.at
          return (
            <div key={m.at} className={`flex items-center gap-3 ${done ? '' : 'opacity-50'}`}>
              <span className="text-xl">{done ? '✅' : '⬜'}</span>
              <span className={done ? 'font-semibold' : ''}>{m.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WeekBar({ w }: { w: WeekProgress }) {
  const masteredPct = w.total ? (w.mastered / w.total) * 100 : 0
  const learningPct = w.total ? (w.learning / w.total) * 100 : 0
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
        <span className="font-semibold">Minggu {w.week} · <span className="text-slate-400">{WEEK_THEME[w.week] ?? ''}</span></span>
        <span className="whitespace-nowrap text-slate-400">
          <span className="text-brand">{w.mastered} dikuasai</span>
          {w.learning > 0 && <> · <span className="text-accent">{w.learning} dipelajari</span></>}
          {' '}/ {w.total}
        </span>
      </div>
      {/* track resesif; segmen dikuasai (brand) + sedang dipelajari (amber), gap 2px */}
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${masteredPct}%` }} />
        <div className="h-full rounded-full bg-accent/70 transition-all" style={{ width: `${learningPct}%` }} />
      </div>
    </div>
  )
}

function Stat({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <div className="card flex flex-col items-center gap-1 py-4">
      <span className="text-2xl">{icon}</span>
      <span className="text-lg font-bold">{value}</span>
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  )
}
