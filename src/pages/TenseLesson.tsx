import { useEffect, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { fetchTenseProgress, markTenseUnderstood, recordTenseCorrect, reviewTenseCard, todayIn } from '../lib/api'
import { isUnlocked, tenseByKey, TENSES, MASTER_AT, UNLOCK_AT, type TenseInfo } from '../lib/tenses'
import type { TenseProgress } from '../lib/types'
import { Skeleton } from '../components/Skeleton'
import { PixelIcon } from '../components/PixelIcon'
import { speak } from '../lib/audio'
import { celebrateMastered } from '../lib/celebrate'
import RecognitionQuiz from '../components/tense/RecognitionQuiz'
import TenseProduce from '../components/tense/TenseProduce'

const REVIEW_TARGET = 3 // kalimat benar untuk menuntaskan satu review SRS

type Step = 'baca' | 'kenali' | 'produksi'

export default function TenseLesson() {
  const { key = '' } = useParams()
  const [params] = useSearchParams()
  const isReview = params.get('mode') === 'review'
  const profile = useAuth((s) => s.profile)
  const tense = tenseByKey(key)

  const [byKey, setByKey] = useState<Record<string, TenseProgress> | null>(null)
  const [step, setStep] = useState<Step>('baca')
  const [count, setCount] = useState(0)          // correct_count (mode belajar)
  const [wasMastered, setWasMastered] = useState(false)
  const [justMastered, setJustMastered] = useState(false)
  const [reviewHits, setReviewHits] = useState(0)
  const [usedHintAny, setUsedHintAny] = useState(false)
  const [reviewDone, setReviewDone] = useState(false)

  useEffect(() => {
    fetchTenseProgress().then((m) => {
      setByKey(m)
      const p = m[key]
      setCount(p?.correct_count ?? 0)
      setWasMastered(p?.status === 'mastered')
      // Review langsung ke produksi; belajar mulai dari Baca.
      if (params.get('mode') === 'review') setStep('produksi')
    }).catch(() => setByKey({}))
  }, [key, params])

  if (!tense) return <Navigate to="/tense" replace />
  if (!profile) return null
  if (!byKey) return <div className="animate-fade-up space-y-4"><Skeleton className="h-8 w-40" /><Skeleton className="h-40 w-full" /></div>

  const today = todayIn(profile.timezone)
  const understood = byKey[key]?.understood ?? false

  if (!isUnlocked(tense.order, byKey)) {
    return <Locked name={tense.name} prevName={TENSES[tense.order - 1]?.name} />
  }

  async function onCorrect(usedHint: boolean) {
    if (isReview) {
      const hits = reviewHits + 1
      setReviewHits(hits)
      if (usedHint) setUsedHintAny(true)
      if (hits >= REVIEW_TARGET) {
        try { await reviewTenseCard(profile!.id, key, usedHintAny || usedHint ? 3 : 5, today) } catch { /* jadwal gagal disimpan */ }
        setReviewDone(true)
      }
      return
    }
    // Naikkan progres lokal dulu supaya UI hidup walau tulis DB gagal
    // (mis. migrasi tense_progress belum dijalankan). DB jadi sumber final bila sukses.
    const nextCount = count + 1
    setCount(nextCount)
    try {
      const updated = await recordTenseCorrect(profile!.id, key, today)
      setCount(updated.correct_count)
      if (updated.status === 'mastered' && !wasMastered) { setWasMastered(true); setJustMastered(true); celebrateMastered() }
    } catch {
      if (nextCount >= MASTER_AT && !wasMastered) { setWasMastered(true); setJustMastered(true); celebrateMastered() }
    }
  }

  return (
    <div className="animate-fade-up space-y-5">
      <Link to="/tense" className="inline-flex items-center gap-1 text-sm font-semibold text-brand">← Semua tense</Link>
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold"><PixelIcon name="pencil" size={22} /> {tense.name}</h1>
        <p className="muted">{tense.nameId}</p>
      </div>

      {step === 'baca' && (
        <Baca tense={tense} onNext={() => setStep(understood ? 'produksi' : 'kenali')} understood={understood} />
      )}

      {step === 'kenali' && (
        <RecognitionQuiz
          items={tense.recognition}
          // Lanjut ke produksi TANPA menunggu DB — tulis "understood" di latar.
          // Kalau ditunggu dan gagal (mis. tabel belum ada), tombol jadi diam.
          onPass={() => { setStep('produksi'); markTenseUnderstood(profile.id, key).catch(() => {}) }}
        />
      )}

      {step === 'produksi' && (
        isReview ? (
          reviewDone ? (
            <div className="card space-y-3 text-center">
              <div className="flex justify-center"><PixelIcon name="party" size={40} className="animate-bob" /></div>
              <p className="font-bold">Review selesai!</p>
              <p className="muted text-sm">{tense.name} dijadwalkan ulang. Sampai jumpa di review berikutnya.</p>
              <Link to="/tense" className="btn-primary">Kembali</Link>
            </div>
          ) : (
            <>
              <p className="tnum text-sm font-semibold muted">Review: buat {REVIEW_TARGET} kalimat benar · {reviewHits}/{REVIEW_TARGET}</p>
              <TenseProduce tense={tense} onCorrect={onCorrect} />
            </>
          )
        ) : (
          <ProduceStage tense={tense} count={count} justMastered={justMastered} onCorrect={onCorrect} onReread={() => setStep('baca')} />
        )
      )}
    </div>
  )
}

function ProduceStage({
  tense, count, justMastered, onCorrect, onReread,
}: { tense: TenseInfo; count: number; justMastered: boolean; onCorrect: (h: boolean) => void; onReread: () => void }) {
  const capped = Math.min(count, MASTER_AT)
  const unlockedNext = count >= UNLOCK_AT
  const mastered = count >= MASTER_AT
  return (
    <div className="space-y-4">
      <div className="tile">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">Progres kalimat</span>
          <span className="tnum muted">{capped}/{MASTER_AT}</span>
        </div>
        <div className="bar mt-2">
          <div className="h-full bg-brand transition-[width] duration-500 ease-pixel" style={{ width: `${(capped / MASTER_AT) * 100}%` }} />
        </div>
        {!unlockedNext && <p className="mt-1 text-xs muted">{UNLOCK_AT - count} kalimat lagi untuk membuka tense berikutnya.</p>}
        {unlockedNext && !mastered && <p className="mt-1 text-xs font-semibold text-brand">✓ Tense berikutnya terbuka! Lanjut sampai {MASTER_AT} untuk menguasai.</p>}
      </div>

      {(mastered || justMastered) && (
        <div className="border-[3px] border-ink bg-gold p-3 text-center dark:border-white/25">
          <p className="flex items-center justify-center gap-2 font-bold text-ink"><PixelIcon name="star" size={18} /> {tense.name} dikuasai — masuk jadwal review!</p>
          <Link to="/tense" className="mt-2 inline-block text-sm font-semibold text-ink underline">Pilih tense lain</Link>
        </div>
      )}

      {/* Wajibkan satu kalimat he/she/it dulu di SEMUA tense — orang ketiga tunggal
          selalu titik tersulit (goes/is/was/has/would), user cenderung menghindarinya. */}
      <TenseProduce tense={tense} onCorrect={onCorrect} requireThirdPerson />

      <button onClick={onReread} className="text-sm font-semibold text-brand">← Baca lagi penjelasannya</button>
    </div>
  )
}

function Baca({ tense, onNext, understood }: { tense: TenseInfo; onNext: () => void; understood: boolean }) {
  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <span className="border-[3px] border-ink bg-gold px-2 py-1 font-pixel text-[10px] text-ink dark:border-white/25">{tense.formula}</span>
        </div>
        <p>{tense.blurb}</p>
        <div>
          <p className="text-sm font-bold">Kapan dipakai:</p>
          <ul className="mt-1 space-y-1">
            {tense.when.map((w, i) => <li key={i} className="flex gap-2 text-sm"><span className="text-brand">▸</span><span>{w}</span></li>)}
          </ul>
        </div>
      </div>

      <div className="card space-y-3">
        <p className="text-sm font-bold">Contoh:</p>
        {tense.examples.map((ex, i) => (
          <div key={i} className="border-[3px] border-ink bg-white p-2 dark:border-white/25 dark:bg-slate-800">
            <button onClick={() => speak(ex.en)} className="flex items-center gap-2 font-semibold text-brand"><PixelIcon name="speaker" size={15} /> {ex.en}</button>
            <p className="text-sm muted">{ex.id}</p>
          </div>
        ))}
      </div>

      <div className="card space-y-3">
        <p className="text-sm font-bold">Salah vs benar:</p>
        {tense.contrast.map((c, i) => (
          <div key={i} className="space-y-1">
            <p className="text-sm text-coral line-through">✗ {c.wrong}</p>
            <p className="text-sm font-semibold text-success">✓ {c.right}</p>
            <p className="text-xs muted">{c.why}</p>
          </div>
        ))}
      </div>

      <button onClick={onNext} className="btn-primary">
        {understood ? 'Lanjut buat kalimat' : 'Aku paham — uji pemahaman'}
      </button>
    </div>
  )
}

function Locked({ name, prevName }: { name: string; prevName?: string }) {
  return (
    <div className="animate-fade-up space-y-4">
      <Link to="/tense" className="inline-flex items-center gap-1 text-sm font-semibold text-brand">← Semua tense</Link>
      <div className="card space-y-2 text-center">
        <div className="flex justify-center"><PixelIcon name="box" size={40} /></div>
        <p className="font-bold">{name} masih terkunci</p>
        <p className="muted text-sm">Selesaikan {UNLOCK_AT} kalimat benar{prevName ? ` di ${prevName}` : ''} untuk membukanya.</p>
      </div>
    </div>
  )
}
