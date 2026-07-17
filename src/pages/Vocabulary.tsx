import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchStudiedWords, type StudiedWord } from '../lib/api'
import { useAuth } from '../store/auth'
import { speak } from '../lib/audio'
import { Skeleton } from '../components/Skeleton'

// Kelompokkan kata per tanggal lokal terakhir dilatih, terbaru dulu.
function groupByDate(words: StudiedWord[], tz: string) {
  const keyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: tz })
  const labelFmt = new Intl.DateTimeFormat('id-ID', { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long' })
  const groups = new Map<string, { label: string; words: StudiedWord[] }>()
  for (const w of words) {
    const d = new Date(w.last_reviewed)
    const key = keyFmt.format(d)
    if (!groups.has(key)) groups.set(key, { label: labelFmt.format(d), words: [] })
    groups.get(key)!.words.push(w)
  }
  return [...groups.values()]
}

export default function Vocabulary() {
  const profile = useAuth((s) => s.profile)
  const [words, setWords] = useState<StudiedWord[] | null>(null)

  useEffect(() => {
    if (!profile) return
    fetchStudiedWords().then(setWords).catch(() => setWords([]))
  }, [profile])

  if (!profile || !words) return (
    <div className="animate-fade-up space-y-4">
      <Skeleton className="h-8 w-40" />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
      </div>
    </div>
  )

  if (words.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="text-5xl">📖</div>
        <h1 className="text-xl font-extrabold">Belum ada kata yang dipelajari</h1>
        <p className="text-slate-500 dark:text-slate-400">Mulai sesi belajar untuk mengisi kosakatamu.</p>
        <Link to="/belajar" className="btn-primary mt-2 block text-center">Mulai belajar</Link>
      </div>
    )
  }

  const mastered = words.filter((w) => w.status === 'mastered').length
  const groups = groupByDate(words, profile.timezone)

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Kosakataku</h1>
        <p className="tnum text-slate-500 dark:text-slate-400">
          {words.length} kata dipelajari · <span className="font-semibold text-brand">{mastered} dikuasai</span> 🎉
        </p>
        <p className="mt-1 text-xs text-slate-400">
          ✅ dikuasai = berhasil diulang beberapa kali · 📘 sedang dipelajari = masih perlu review
        </p>
      </div>

      {groups.map((g) => (
        <section key={g.label} className="space-y-2">
          <div className="flex items-center gap-2">
            <h2 className="font-bold">{g.label}</h2>
            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
              {g.words.length} kata
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {g.words.map((w) => (
              <button
                key={w.text} onClick={() => speak(w.text)}
                className="tile flex items-center justify-between !p-3 text-left transition duration-200 ease-soft hover:ring-2 hover:ring-brand/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                <span>
                  <span className="font-bold text-brand">{w.text}</span>
                  {w.phonetic && <span className="ml-1 text-xs text-slate-400">{w.phonetic}</span>}
                  <span className="block text-sm text-slate-500 dark:text-slate-400">{w.translation_id}</span>
                </span>
                <span className="text-lg" title={w.status === 'mastered' ? 'dikuasai' : 'sedang dipelajari'}>
                  {w.status === 'mastered' ? '✅' : '📘'}
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
