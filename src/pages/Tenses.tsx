import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { fetchTenseProgress, todayIn } from '../lib/api'
import { TENSES, tenseStage, UNLOCK_AT, MASTER_AT, type TenseInfo } from '../lib/tenses'
import type { TenseProgress } from '../lib/types'
import { Skeleton } from '../components/Skeleton'
import { PixelIcon, type PixelIconName } from '../components/PixelIcon'

export default function Tenses() {
  const profile = useAuth((s) => s.profile)
  const [byKey, setByKey] = useState<Record<string, TenseProgress> | null>(null)

  useEffect(() => { fetchTenseProgress().then(setByKey).catch(() => setByKey({})) }, [])

  if (!profile) return null
  const today = todayIn(profile.timezone)

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold">
          <PixelIcon name="book" size={24} /> Belajar Tense
        </h1>
        <p className="muted">Pelajari 16 tense satu per satu. Buat {UNLOCK_AT} kalimat benar untuk membuka tense berikutnya, {MASTER_AT} untuk menguasainya.</p>
      </div>

      {!byKey ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : (
        <div className="space-y-3">
          {TENSES.map((t) => <TenseRow key={t.key} tense={t} byKey={byKey} today={today} />)}
        </div>
      )}
    </div>
  )
}

function TenseRow({ tense, byKey, today }: { tense: TenseInfo; byKey: Record<string, TenseProgress>; today: string }) {
  const stage = tenseStage(tense, byKey)
  const p = byKey[tense.key]
  const count = Math.min(p?.correct_count ?? 0, MASTER_AT)
  const due = stage === 'mastered' && p?.due_date && p.due_date <= today

  if (stage === 'locked') {
    const prev = TENSES[tense.order - 1]
    return (
      <div className="tile flex items-center gap-3 opacity-60">
        <PixelIcon name="box" size={22} />
        <div className="min-w-0">
          <p className="truncate font-bold">{tense.name}</p>
          <p className="truncate text-xs muted">Buka dengan {UNLOCK_AT} kalimat benar {prev?.name}</p>
        </div>
      </div>
    )
  }

  const icon: PixelIconName = stage === 'mastered' ? 'star' : 'pencil'
  return (
    <Link to={`/tense/${tense.key}${due ? '?mode=review' : ''}`} className="card block !p-4">
      <div className="flex items-center gap-3">
        <PixelIcon name={icon} size={22} className={stage === 'mastered' ? '' : ''} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-bold">{tense.name}</p>
            {due
              ? <span className="border-[3px] border-ink bg-accent px-2 py-0.5 text-xs font-bold text-ink dark:border-white/25">Review</span>
              : stage === 'mastered'
                ? <span className="text-xs font-bold text-brand">Dikuasai</span>
                : <span className="tnum text-xs muted">{count}/{MASTER_AT}</span>}
          </div>
          <p className="truncate text-xs muted">{tense.nameId} · {tense.formula}</p>
          {stage === 'learning' && (
            <div className="bar mt-2 h-3">
              <div className="h-full bg-brand transition-[width] duration-500 ease-pixel" style={{ width: `${(count / MASTER_AT) * 100}%` }} />
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
