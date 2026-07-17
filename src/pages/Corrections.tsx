import { useEffect, useState } from 'react'
import { fetchErrors, resolveError, todayIn } from '../lib/api'
import { useAuth } from '../store/auth'
import { speak } from '../lib/audio'
import { ListSkeleton } from '../components/Skeleton'

// Deck Koreksi: kesalahan lama diulang. Tandai paham → resolved = true.
export default function Corrections() {
  const profile = useAuth((s) => s.profile)
  const [errors, setErrors] = useState<any[] | null>(null)

  useEffect(() => {
    if (!profile) return
    fetchErrors(todayIn(profile.timezone)).then(setErrors).catch(() => setErrors([]))
  }, [profile])

  async function done(id: number) {
    await resolveError(id)
    setErrors((e) => e?.filter((x) => x.id !== id) ?? null)
  }

  if (!errors) return <div className="animate-fade-up"><ListSkeleton rows={3} /></div>
  if (errors.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="text-5xl">🌟</div>
        <h1 className="text-xl font-extrabold">Tidak ada koreksi tertunda</h1>
        <p className="text-slate-500 dark:text-slate-400">Kerja bagus! Kesalahanmu sudah beres.</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-up space-y-4">
      <h1 className="text-2xl font-extrabold">Deck Koreksi</h1>
      <p className="text-slate-500 dark:text-slate-400">Ulangi yang sempat keliru — pelan-pelan nempel.</p>
      {errors.map((e) => (
        <div key={e.id} className="card space-y-2">
          <p className="text-sm text-slate-400">Kata: <b className="text-brand">{e.word?.text}</b></p>
          <p className="text-coral line-through">{e.wrong_sentence}</p>
          {e.correction && (
            <button onClick={() => speak(e.correction)} className="font-semibold text-success">
              🔊 {e.correction}
            </button>
          )}
          {e.explanation_id && <p className="text-sm text-slate-500 dark:text-slate-400">{e.explanation_id}</p>}
          <button onClick={() => done(e.id)} className="btn-primary mt-2">Sudah paham ✓</button>
        </div>
      ))}
    </div>
  )
}
