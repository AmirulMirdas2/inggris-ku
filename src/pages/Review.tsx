import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchDueCards, todayIn } from '../lib/api'
import { useAuth } from '../store/auth'
import SessionRunner, { type SessionItem } from '../components/session/SessionRunner'

export default function Review() {
  const profile = useAuth((s) => s.profile)
  const [items, setItems] = useState<SessionItem[] | null>(null)

  useEffect(() => {
    if (!profile) return
    fetchDueCards(todayIn(profile.timezone))
      .then((rows) => setItems(rows.map(({ card, word }) => ({ word, prev: card }))))
      .catch(() => setItems([]))
  }, [profile])

  if (!items) return <div className="py-16 text-center text-slate-400">Memuat review…</div>
  if (items.length === 0) return <Empty />
  return <SessionRunner items={items} mode="review" />
}

function Empty() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="text-5xl">🎉</div>
      <h1 className="text-xl font-extrabold">Tidak ada review hari ini!</h1>
      <p className="text-slate-500 dark:text-slate-400">Ingatanmu masih segar. Pelajari kata baru, yuk.</p>
      <Link to="/belajar" className="btn-primary mt-2 block text-center">Belajar kata baru</Link>
    </div>
  )
}
