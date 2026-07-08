import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { fetchDueCards, todayIn } from '../lib/api'

const NEXT_MILESTONE = [
  { at: 10, label: 'Kata pertama dikuasai' },
  { at: 50, label: '50 kata — bisa perkenalan diri' },
  { at: 100, label: '100 kata — kalimat harian' },
  { at: 500, label: '500 kata — ~80% percakapan warung' },
]

export default function Dashboard() {
  const profile = useAuth((s) => s.profile)
  const [due, setDue] = useState(0)

  useEffect(() => {
    if (!profile) return
    fetchDueCards(todayIn(profile.timezone)).then((r) => setDue(r.length)).catch(() => {})
  }, [profile])

  if (!profile) return <div className="py-16 text-center text-slate-400">Memuat beranda…</div>
  const next = NEXT_MILESTONE.find((m) => profile.words_mastered < m.at) ?? NEXT_MILESTONE[NEXT_MILESTONE.length - 1]
  const pct = Math.min(100, Math.round((profile.words_mastered / next.at) * 100))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Halo, {profile.display_name}! 👋</h1>
        <p className="text-slate-500 dark:text-slate-400">Siap belajar hari ini?</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Target" value={`${profile.daily_goal}`} icon="🎯" />
        <Stat label="Streak" value={`${profile.streak_days} hari`} icon="🔥" />
        <Stat label="XP" value={`${profile.xp}`} icon="⭐" />
      </div>

      <div className="space-y-3">
        <Link to="/belajar" className="btn-primary block text-center">Mulai belajar</Link>
        <Link to="/review" className="btn-ghost block text-center">Review hari ini ({due})</Link>
      </div>

      <div className="card">
        <p className="text-sm font-semibold text-slate-400">Milestone berikutnya</p>
        <p className="mt-1 text-lg font-bold">{next.label}</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1 text-xs text-slate-400">{profile.words_mastered}/{next.at} kata</p>
      </div>
    </div>
  )
}

function Stat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="card flex flex-col items-center gap-1 py-4">
      <span className="text-2xl">{icon}</span>
      <span className="text-lg font-bold">{value}</span>
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  )
}
