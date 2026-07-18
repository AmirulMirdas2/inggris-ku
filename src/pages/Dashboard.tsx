import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../store/auth'
import { fetchDueCards, todayIn } from '../lib/api'
import { Skeleton } from '../components/Skeleton'
import { PixelIcon, type PixelIconName } from '../components/PixelIcon'

// Masuk berjenjang: tiap blok naik-fade sedikit demi sedikit.
const container = { show: { transition: { staggerChildren: 0.06 } } }
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.6, 0, 0.4, 1] } },
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
        <h1 className="flex items-center gap-2 text-2xl font-extrabold">Halo, {profile.display_name} <PixelIcon name="wave" size={24} /></h1>
        <p className="muted">Siap belajar hari ini?</p>
      </motion.div>

      <motion.div className="grid grid-cols-3 gap-3" variants={item}>
        <Stat label="Target" value={`${profile.daily_goal}`} icon="target" />
        <Stat label="Streak" value={`${profile.streak_days} hari`} icon="fire" anim="animate-flicker" />
        <Stat label="XP" value={`${profile.xp}`} icon="star" />
      </motion.div>

      <motion.div className="space-y-3" variants={item}>
        <Link to="/belajar" className="btn-primary block text-center">Mulai belajar</Link>
        <Link to="/review" className="btn-ghost block text-center">Review hari ini ({due})</Link>
      </motion.div>

      <motion.div className="card" variants={item}>
        <p className="text-sm font-semibold muted">Milestone berikutnya</p>
        <p className="mt-1 text-lg font-bold">{next.label}</p>
        <div className="bar mt-3">
          <div className="h-full bg-accent transition-[width] duration-500 ease-pixel" style={{ width: `${pct}%` }} />
        </div>
        <p className="tnum mt-1 text-xs muted">{profile.words_mastered}/{next.at} kata</p>
      </motion.div>
    </motion.div>
  )
}

function Stat({ label, value, icon, anim = '' }: { label: string; value: string; icon: PixelIconName; anim?: string }) {
  return (
    <div className="tile flex flex-col items-center gap-1">
      <PixelIcon name={icon} size={28} className={anim} />
      <span className="tnum font-pixel text-[10px] leading-relaxed">{value}</span>
      <span className="text-xs muted">{label}</span>
    </div>
  )
}
