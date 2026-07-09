import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Word, ReviewCard } from '../../lib/types'
import { levelForWeek } from '../../lib/exercises'
import { qualityFrom } from '../../lib/srs'
import {
  applyReview, recordAttempt, addError, bumpProgress, xpFor, todayIn,
} from '../../lib/api'
import { useAuth } from '../../store/auth'
import { celebrate } from '../../lib/celebrate'
import PhaseRecognize from './PhaseRecognize'
import PhaseProduce, { type ProduceResult } from './PhaseProduce'

export interface SessionItem {
  word: Word
  prev?: ReviewCard | null
}

// Orkestrator loop. mode 'learn' → Fase A dulu; 'review' → langsung produksi.
export default function SessionRunner({ items, mode }: { items: SessionItem[]; mode: 'learn' | 'review' }) {
  const { session, profile, setProfile } = useAuth()
  const [i, setI] = useState(0)
  const [phase, setPhase] = useState<'recognize' | 'produce'>(mode === 'learn' ? 'recognize' : 'produce')
  const [xpGained, setXpGained] = useState(0)

  if (!session || !profile) return null
  if (i >= items.length) return <Summary xp={xpGained} count={items.length} />

  const { word, prev } = items[i]
  const today = todayIn(profile.timezone)
  const level = levelForWeek(word.theme_week)

  function next() {
    setPhase(mode === 'learn' ? 'recognize' : 'produce')
    setI((n) => n + 1)
  }

  async function handleResult(r: ProduceResult) {
    const correct = !r.usedHint
    const quality = qualityFrom(true, r.usedHint)
    const gained = xpFor(true, r.usedHint, r.bonusTense)

    // Persist. Dijalankan paralel; kegagalan tidak menghentikan sesi.
    try {
      const { becameMastered } = await applyReview({ userId: session!.user.id, word, quality, today, prev })
      await recordAttempt({
        userId: session!.user.id, wordId: word.id, sentence: r.sentence, correct,
        corrected: r.corrected, explanation: r.explanation, bonus: r.bonusTense,
      })
      if (r.usedHint && r.wrongSentence) {
        await addError({
          userId: session!.user.id, wordId: word.id, wrong: r.wrongSentence,
          correction: r.corrected, explanation: r.explanation, today,
        })
      }
      const np = await bumpProgress({ profile: profile!, addXp: gained, masteredDelta: becameMastered ? 1 : 0, today })
      setProfile(np)
    } catch (e) {
      console.error('Gagal simpan progres:', e)
    }

    setXpGained((x) => x + gained)
    if (correct) celebrate()
    next()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(i / items.length) * 100}%` }} />
        </div>
        <span className="text-sm text-slate-400">{i + 1}/{items.length}</span>
      </div>

      {phase === 'recognize'
        ? <PhaseRecognize key={i} word={word} onDone={() => setPhase('produce')} />
        : <PhaseProduce key={i} word={word} level={level} mode={mode} onResult={handleResult} />}
    </div>
  )
}

function Summary({ xp, count }: { xp: number; count: number }) {
  return (
    <div className="card space-y-4 text-center">
      <div className="text-5xl">🎉</div>
      <h2 className="text-2xl font-extrabold">Sesi selesai!</h2>
      <p className="text-slate-500 dark:text-slate-400">{count} kata dilatih · +{xp} XP</p>
      <Link to="/dashboard" className="btn-primary block text-center">Kembali ke Beranda</Link>
    </div>
  )
}
