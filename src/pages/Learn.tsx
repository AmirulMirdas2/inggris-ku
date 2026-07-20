import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchNewWords, advanceWeek } from '../lib/api'
import { useAuth } from '../store/auth'
import SessionRunner, { type SessionItem } from '../components/session/SessionRunner'
import { ListSkeleton } from '../components/Skeleton'
import { PixelIcon } from '../components/PixelIcon'

export default function Learn() {
  const { profile, setProfile } = useAuth()
  const [items, setItems] = useState<SessionItem[] | null>(null)

  useEffect(() => {
    if (!profile) return
    setItems(null)
    fetchNewWords(profile.current_week, profile.daily_goal)
      .then((words) => setItems(words.map((word) => ({ word }))))
      .catch(() => setItems([]))
  }, [profile])

  async function skipWeek() {
    if (!profile) return
    setItems(null)
    setProfile(await advanceWeek(profile)) // efek re-run → ambil kata minggu baru
  }

  if (!items) return <Loading />
  if (items.length === 0) return <Empty week={profile?.current_week ?? 1} onSkip={skipWeek} />
  return <SessionRunner items={items} mode="learn" />
}

function Loading() {
  return <div className="animate-fade-up"><ListSkeleton rows={3} /></div>
}

function Empty({ week, onSkip }: { week: number; onSkip: () => void }) {
  return (
    <div className="animate-fade-up space-y-4 py-8">
      <div className="rounded-card border-2 border-accent/50 bg-accent/10 p-5 text-center">
        <div className="flex justify-center"><PixelIcon name="balloon" size={48} className="animate-bob" /></div>
        <h1 className="mt-2 text-xl font-extrabold">Kata Minggu {week} sudah habis!</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-300">
          Semua kata baru minggu ini sudah kamu mulai. Cara terbaik: perkuat lewat
          <b> Review</b> sampai kata jadi "dikuasai".
        </p>
      </div>

      <div className="space-y-3">
        <Link to="/review" className="btn-primary block text-center">Ke Review sekarang</Link>
        <button onClick={onSkip} className="btn-ghost">
          Tidak sabar? Buka kata Minggu {week + 1} →
        </button>
        <Link to="/tense" className="btn-ghost flex items-center justify-center gap-2">
          <PixelIcon name="book" size={18} /> Belajar Tense sambil menunggu
        </Link>
        <Link to="/kosakata" className="block text-center text-sm font-semibold text-brand">
          Lihat kosakata yang sudah kupelajari
        </Link>
      </div>
      <p className="text-center text-xs muted">
        Melewati minggu boleh saja — tapi mengulang kata lama tetap penting agar tidak lupa.
      </p>
    </div>
  )
}
