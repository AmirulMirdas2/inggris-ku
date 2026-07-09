import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { Word } from '../../lib/types'
import type { Level } from '../../lib/exercises'
import { blankSentence, checkBlank, checkArrange, tokenize, shuffle } from '../../lib/exercises'
import { evaluateSentence } from '../../lib/api'
import { speak } from '../../lib/audio'

export interface ProduceResult {
  usedHint: boolean
  bonusTense: boolean
  sentence: string
  wrongSentence?: string
  corrected?: string
  explanation?: string
}

// FASE B — produksi terpandu. Tidak pernah nge-blok: selalu ada "Lihat contoh".
export default function PhaseProduce({
  word, level, mode, onResult,
}: { word: Word; level: Level; mode: 'learn' | 'review'; onResult: (r: ProduceResult) => void }) {
  const example = word.example_en ?? `I like ${word.text}.`
  const [feedback, setFeedback] = useState<null | { ok: boolean; msg: string }>(null)
  const [revealed, setRevealed] = useState(false)
  const [firstWrong, setFirstWrong] = useState<string | null>(null)
  const [bonusTense, setBonusTense] = useState(false)
  const [corrected, setCorrected] = useState<string | undefined>()

  function pass(sentence: string, usedHint: boolean) {
    onResult({
      usedHint,
      bonusTense,
      sentence,
      wrongSentence: usedHint ? firstWrong ?? sentence : undefined,
      corrected,
      explanation: feedback?.msg,
    })
  }

  function markWrong(attempt: string, msg: string) {
    if (firstWrong === null) setFirstWrong(attempt)
    setFeedback({ ok: false, msg })
  }

  return (
    <motion.div
      key={word.id}
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className={`card space-y-4 ${feedback && !feedback.ok ? 'shake border-2 border-coral' : ''}`}
    >
      {mode === 'review' ? (
        // Review = uji ingatan: sembunyikan kata Inggris, beri arti sebagai petunjuk.
        <p className="text-sm font-semibold text-slate-400">
          Ingat kata Inggrisnya: <span className="text-brand">{word.translation_id}</span>
        </p>
      ) : (
        <p className="text-sm font-semibold text-slate-400">
          Kata target: <span className="text-brand">{word.text}</span> · {word.translation_id}
        </p>
      )}

      {level === 1 && <BlankExercise word={word} onWrong={markWrong} onRight={(s) => { setFeedback({ ok: true, msg: '' }); pass(s, false) }} disabled={!!feedback?.ok || revealed} />}
      {level === 2 && <ArrangeExercise example={example} onWrong={markWrong} onRight={(s) => { setFeedback({ ok: true, msg: '' }); pass(s, false) }} disabled={!!feedback?.ok || revealed} />}
      {level === 3 && <FreeExercise word={word} onWrong={markWrong} onRight={(s, bonus, corr) => { setBonusTense(bonus); setCorrected(corr); setFeedback({ ok: true, msg: '' }); pass(s, false) }} disabled={!!feedback?.ok || revealed} />}

      {feedback && !feedback.ok && (
        <div className="space-y-3">
          <p className="rounded-xl bg-coral/10 p-3 text-coral">{feedback.msg}</p>
          {revealed ? (
            <div className="rounded-xl bg-black/5 p-3 dark:bg-white/5">
              <button onClick={() => speak(example)} className="font-semibold text-brand">🔊 {example}</button>
              <p className="text-sm text-slate-500 dark:text-slate-400">{word.example_id}</p>
              <button onClick={() => pass(example, true)} className="btn-primary mt-3">Lanjut</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setFeedback(null)} className="btn-ghost">Coba lagi</button>
              <button onClick={() => setRevealed(true)} className="btn-primary">Lihat contoh & pelajari</button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

// --- Level 1: isi rumpang ---
function BlankExercise({ word, onWrong, onRight, disabled }: {
  word: Word; onWrong: (a: string, m: string) => void; onRight: (s: string) => void; disabled: boolean
}) {
  const { prompt, answer } = useMemo(() => blankSentence(word.example_en ?? '', word.text), [word])
  const [val, setVal] = useState('')
  // Blank sepanjang jumlah huruf jawaban, mis. "good" → ＿ ＿ ＿ ＿ (petunjuk panjang).
  const display = prompt.replace('___', Array(answer.length).fill('＿').join(' '))
  return (
    <div className="space-y-3">
      <p className="text-lg">Isi bagian kosong dengan kata Inggris yang tepat:</p>
      <p className="text-xl font-bold">{display}</p>
      <p className="text-sm text-slate-400">Petunjuk: artinya “{word.translation_id}” · {answer.length} huruf</p>
      <input
        value={val} disabled={disabled} onChange={(e) => setVal(e.target.value)}
        placeholder="ketik kata…"
        className="w-full rounded-xl border border-black/10 bg-transparent px-4 py-3 text-lg outline-none focus:border-brand dark:border-white/15"
      />
      <button
        disabled={disabled || !val.trim()}
        onClick={() => checkBlank(val, answer) ? onRight(prompt.replace('___', val)) : onWrong(val, `Belum tepat. Coba dengar lagi, kata yang pas adalah bagian dari "${word.translation_id}".`)}
        className="btn-primary"
      >Periksa</button>
    </div>
  )
}

// --- Level 2: susun kata ---
function ArrangeExercise({ example, onWrong, onRight, disabled }: {
  example: string; onWrong: (a: string, m: string) => void; onRight: (s: string) => void; disabled: boolean
}) {
  const original = example
  const chips = useMemo(() => shuffle(tokenize(example)), [example])
  const [picked, setPicked] = useState<number[]>([])
  const pickedSet = new Set(picked)
  const answer = picked.map((i) => chips[i]).join(' ')

  return (
    <div className="space-y-3">
      <p className="text-lg">Susun jadi kalimat yang benar:</p>
      <div className="min-h-12 rounded-xl border border-dashed border-black/15 p-3 text-lg dark:border-white/20">
        {answer || <span className="text-slate-400">ketuk kata di bawah…</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map((c, i) => (
          <button
            key={i} disabled={disabled || pickedSet.has(i)}
            onClick={() => setPicked([...picked, i])}
            className={`rounded-full px-4 py-2 font-semibold ${pickedSet.has(i) ? 'bg-black/5 text-slate-300 dark:bg-white/5' : 'bg-brand/10 text-brand'}`}
          >{c}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setPicked([])} disabled={disabled || !picked.length} className="btn-ghost">Ulang</button>
        <button
          disabled={disabled || picked.length !== chips.length}
          onClick={() => checkArrange(picked.map((i) => chips[i]), original) ? onRight(answer) : onWrong(answer, 'Urutannya belum pas. Perhatikan kata mana yang jadi subjek di depan.')}
          className="btn-primary"
        >Periksa</button>
      </div>
    </div>
  )
}

// --- Level 3: kalimat bebas (LLM) ---
function FreeExercise({ word, onWrong, onRight, disabled }: {
  word: Word; onWrong: (a: string, m: string) => void; onRight: (s: string, bonus: boolean, corr?: string) => void; disabled: boolean
}) {
  const [val, setVal] = useState('')
  const [busy, setBusy] = useState(false)

  async function check() {
    setBusy(true)
    try {
      const ev = await evaluateSentence(word.text, word.tense_focus, val)
      if (ev.benar && ev.pakaiKataTarget) onRight(val, ev.bonusTense, ev.kalimatKoreksi || undefined)
      else onWrong(val, ev.penjelasanId || 'Belum tepat, tapi usahamu bagus! Coba perbaiki sedikit.')
    } catch {
      onWrong(val, 'Koneksi bermasalah. Cek internet lalu coba lagi ya. 🙂')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-lg">Buat kalimatmu sendiri pakai kata <b>{word.text}</b>:</p>
      <textarea
        value={val} disabled={disabled} onChange={(e) => setVal(e.target.value)} rows={2}
        placeholder="tulis kalimat bahasa Inggris…"
        className="w-full rounded-xl border border-black/10 bg-transparent px-4 py-3 text-lg outline-none focus:border-brand dark:border-white/15"
      />
      <button onClick={check} disabled={disabled || busy || !val.trim()} className="btn-primary">
        {busy ? 'Menilai…' : 'Periksa'}
      </button>
    </div>
  )
}
