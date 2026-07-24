import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Word, ReviewCard } from '../../lib/types'
import { levelForWeek } from '../../lib/exercises'
import { qualityFrom } from '../../lib/srs'
import {
  applyReview, recordAttempt, addError, bumpProgress, xpFor, todayIn,
} from '../../lib/api'
import { useAuth } from '../../store/auth'
import { celebrate, celebrateMastered } from '../../lib/celebrate'
import { suppressMusic, releaseMusic } from '../../lib/music'
import { PixelIcon } from '../PixelIcon'
import PhaseRecognize from './PhaseRecognize'
import PhaseWrite from './PhaseWrite'
import PhaseProduce, { type ProduceResult } from './PhaseProduce'

export interface SessionItem {
  word: Word
  prev?: ReviewCard | null
}

// Orkestrator loop. mode 'learn' → Fase A dulu; 'review' → langsung produksi.
export default function SessionRunner({ items, mode }: { items: SessionItem[]; mode: 'learn' | 'review' }) {
  const { session, profile, setProfile } = useAuth()
  const [i, setI] = useState(0)
  // learn: kenali → tulis 3x → produksi. review harian: tulis 1x → produksi.
  const [phase, setPhase] = useState<'recognize' | 'write' | 'produce'>(mode === 'learn' ? 'recognize' : 'write')
  const [xpGained, setXpGained] = useState(0)
  const done = i >= items.length

  // Saat latihan berjalan musik latar senyap — tersisa SFX & bunyi ketikan,
  // supaya konsentrasi tidak terbagi. Musik kembali di layar ringkasan.
  useEffect(() => {
    if (done) releaseMusic()
    else suppressMusic()
    return releaseMusic
  }, [done])

  if (!session || !profile) return null
  if (done) return <Summary xp={xpGained} count={items.length} />

  const { word, prev } = items[i]
  const today = todayIn(profile.timezone)
  const level = levelForWeek(word.theme_week)

  function next() {
    setPhase(mode === 'learn' ? 'recognize' : 'write')
    setI((n) => n + 1)
  }

  async function handleResult(r: ProduceResult) {
    const correct = !r.usedHint
    const quality = qualityFrom(true, r.usedHint)
    const gained = xpFor(true, r.usedHint, r.bonusTense)

    // Persist. Dijalankan paralel; kegagalan tidak menghentikan sesi.
    let becameMastered = false
    try {
      ;({ becameMastered } = await applyReview({ userId: session!.user.id, word, quality, today, prev }))
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
    if (correct) (becameMastered ? celebrateMastered() : celebrate())
    next()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="bar flex-1">
          <div className="h-full bg-brand transition-[width] duration-500 ease-pixel" style={{ width: `${(i / items.length) * 100}%` }} />
        </div>
        <span className="tnum text-sm muted">{i + 1}/{items.length}</span>
      </div>

      {phase === 'recognize'
        ? <PhaseRecognize key={i} word={word} onDone={() => setPhase('write')} />
        : phase === 'write'
          ? <PhaseWrite key={`w${i}`} word={word} reps={mode === 'learn' ? 3 : 1} onDone={() => setPhase('produce')} />
          : <PhaseProduce key={i} word={word} level={level} mode={mode} onResult={handleResult} />}
    </div>
  )
}

function Summary({ xp, count }: { xp: number; count: number }) {
  return (
    <div className="card space-y-4 text-center">
      <div className="flex justify-center"><PixelIcon name="party" size={64} className="animate-bob" /></div>
      <h2 className="text-2xl font-extrabold">Sesi selesai!</h2>
      <p className="tnum muted">{count} kata dilatih · +{xp} XP</p>
      <Link to="/dashboard" className="btn-primary block text-center">Kembali ke Beranda</Link>
    </div>
  )
}
