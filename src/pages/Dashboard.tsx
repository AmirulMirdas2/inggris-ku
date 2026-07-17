import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../store/auth'
import { fetchDueCards, todayIn } from '../lib/api'
import { Skeleton } from '../components/Skeleton'

// Masuk berjenjang: tiap blok naik-fade sedikit demi sedikit.
const container = { show: { transition: { staggerChildren: 0.06 } } }
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } },
} as const

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

  if (!profile) return (
    <div className="animate-fade-up space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-14 w-full rounded-full" />
        <Skeleton className="h-14 w-full rounded-full" />
      </div>
      <Skeleton className="h-28 w-full rounded-card" />
    </div>
  )
  const next = NEXT_MILESTONE.find((m) => profile.words_mastered < m.at) ?? NEXT_MILESTONE[NEXT_MILESTONE.length - 1]
  const pct = Math.min(100, Math.round((profile.words_mastered / next.at) * 100))

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      <motion.div variants={item}>
        <h1 className="text-2xl font-extrabold">Halo, {profile.display_name} <span aria-hidden>👋</span></h1>
        <p className="text-slate-500 dark:text-slate-400">Siap belajar hari ini?</p>
      </motion.div>

      <motion.div className="grid grid-cols-3 gap-3" variants={item}>
        <Stat label="Target" value={`${profile.daily_goal}`} icon="🎯" />
        <Stat label="Streak" value={`${profile.streak_days} hari`} icon="🔥" />
        <Stat label="XP" value={`${profile.xp}`} icon="⭐" />
      </motion.div>

      <motion.div className="space-y-3" variants={item}>
        <Link to="/belajar" className="btn-primary block text-center">Mulai belajar</Link>
        <Link to="/review" className="btn-ghost block text-center">Review hari ini ({due})</Link>
      </motion.div>

      <motion.div className="card" variants={item}>
        <p className="text-sm font-semibold text-slate-400">Milestone berikutnya</p>
        <p className="mt-1 text-lg font-bold">{next.label}</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
          <div className="h-full rounded-full bg-accent transition-[width] duration-500 ease-soft" style={{ width: `${pct}%` }} />
        </div>
        <p className="tnum mt-1 text-xs text-slate-400">{profile.words_mastered}/{next.at} kata</p>
      </motion.div>
    </motion.div>
  )
}

function Stat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="tile flex flex-col items-center gap-1">
      <span className="text-2xl">{icon}</span>
      <span className="tnum text-lg font-bold">{value}</span>
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  )
}
