import { useState } from 'react'
import { motion } from 'framer-motion'
import { PixelIcon } from '../PixelIcon'
import type { Word } from '../../lib/types'
import { speak } from '../../lib/audio'
import { sfxCorrect } from '../../lib/sfx'
import { PosBadge } from '../PosBadge'

// Bandingkan longgar: abaikan spasi ganda, huruf besar/kecil, & tanda baca pinggir.
export const norm = (s: string) =>
  s.trim().toLowerCase().replace(/\s+/g, ' ').replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '')

// Fase "Tulis" — hafalkan kata dengan menuliskannya ulang sebelum bikin kalimat.
// learn: reps=3, review harian: reps=1. Jawaban disembunyikan (recall), ada
// tombol "lihat" bila lupa.
export default function PhaseWrite({ word, reps, onDone }: { word: Word; reps: number; onDone: () => void }) {
  const [done, setDone] = useState(0)
  const [en, setEn] = useState('')
  const [id, setId] = useState('')
  const [peek, setPeek] = useState(false)
  const [tried, setTried] = useState(false)
  const enOk = norm(en) === norm(word.text)
  const idOk = norm(id) === norm(word.translation_id)

  function submit() {
    if (!enOk || !idOk) { setTried(true); return }
    sfxCorrect()
    const n = done + 1
    if (n >= reps) return onDone()
    setDone(n); setEn(''); setId(''); setPeek(false); setTried(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.6, 0, 0.4, 1] }}
      className="card space-y-4"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-semibold muted"><PixelIcon name="target" size={16} /> Tulis untuk menghafal</p>
        <span className="tnum text-sm muted">{done + 1}/{reps}</span>
      </div>

      <p className="text-sm muted">Ketik kata ini dalam Bahasa Inggris dan artinya, lalu ingat baik-baik.</p>
      {word.part_of_speech && (
        <p className="flex items-center gap-2 text-sm">Petunjuk kelas kata: <PosBadge pos={word.part_of_speech} /></p>
      )}

      <div className="space-y-1">
        <label className="text-sm font-semibold">Bahasa Inggris</label>
        <input
          value={en} onChange={(e) => setEn(e.target.value)} autoFocus
          onKeyDown={(e) => e.key === 'Enter' && (document.getElementById('write-id') as HTMLInputElement)?.focus()}
          placeholder="tulis kata Inggris…"
          className={`input ${tried && !enOk ? 'border-coral' : ''}`}
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-semibold">Bahasa Indonesia</label>
        <input
          id="write-id" value={id} onChange={(e) => setId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="tulis artinya…"
          className={`input ${tried && !idOk ? 'border-coral' : ''}`}
        />
      </div>

      {tried && (!enOk || !idOk) && (
        <p className="text-sm text-coral">Belum tepat. Coba ingat lagi, atau tekan "lihat" kalau lupa.</p>
      )}

      {peek && (
        <div className="border-[3px] border-ink bg-gold/20 p-3 text-sm dark:border-white/25">
          <button onClick={() => speak(word.text)} className="flex items-center gap-2 font-bold text-brand">
            <PixelIcon name="speaker" size={16} /> {word.text}
          </button>
          <p className="muted">{word.translation_id}</p>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={submit} disabled={!en.trim() || !id.trim()} className="btn-primary flex-1">Periksa</button>
        <button onClick={() => setPeek((p) => !p)} className="btn-ghost">{peek ? 'tutup' : 'lihat'}</button>
      </div>
    </motion.div>
  )
}
