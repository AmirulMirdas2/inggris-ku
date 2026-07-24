import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { Word } from '../../lib/types'
import type { Level } from '../../lib/exercises'
import { blankSentence, checkBlank, checkArrange, tokenize, shuffle } from '../../lib/exercises'
import { evaluateSentence, unlockedTenseKeys } from '../../lib/api'
import type { Koreksi } from '../../lib/types'
import { speak } from '../../lib/audio'
import { tenseByKey, TENSES, detectedMatchesTense } from '../../lib/tenses'
import { PixelIcon } from '../PixelIcon'
import { PosBadge } from '../PosBadge'
import { CorrectionCards, buildErrors, useCorrectionCards } from '../CorrectionCards'

// tense_focus kata (enum DB) → key materi tense untuk pilihan default.
const FOCUS_TO_KEY: Record<string, string> = {
  presentSimple: 'presentSimple', presentContinuous: 'presentContinuous',
  pastSimple: 'pastSimple', future: 'futureSimple',
}

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
  const [feedback, setFeedback] = useState<null | { ok: boolean; msg: string; arti?: string }>(null)
  const [revealed, setRevealed] = useState(false)
  const [firstWrong, setFirstWrong] = useState<string | null>(null)
  const [bonusTense, setBonusTense] = useState(false)
  const [corrected, setCorrected] = useState<string | undefined>()
  // Level 3: checklist koreksi ber-aspek (dicoret saat diperbaiki) + arti + penjelasan.
  // Kartu reset otomatis tiap kata karena motion.div di-remount pada word.id.
  const { cards, sync } = useCorrectionCards()
  const [wrongArti, setWrongArti] = useState<string | undefined>()
  const [explanation, setExplanation] = useState<string | undefined>()
  // Level 3: setelah kalimat benar, tahan sebentar untuk tampilkan arti sebelum lanjut.
  const [success, setSuccess] = useState<null | { sentence: string; arti: string }>(null)

  function pass(sentence: string, usedHint: boolean) {
    onResult({
      usedHint,
      bonusTense,
      sentence,
      wrongSentence: usedHint ? firstWrong ?? sentence : undefined,
      corrected,
      explanation: explanation ?? feedback?.msg,
    })
  }

  function markWrong(attempt: string, msg: string, arti?: string) {
    if (firstWrong === null) setFirstWrong(attempt)
    setFeedback({ ok: false, msg, arti })
  }

  return (
    <motion.div
      key={word.id}
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.6, 0, 0.4, 1] }}
      className={`card space-y-4 ${(feedback && !feedback.ok) || cards.some((c) => !c.fixed) ? 'shake border-2 border-coral' : ''}`}
    >
      {mode === 'review' ? (
        // Review = uji ingatan: sembunyikan kata Inggris, beri arti sebagai petunjuk.
        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold muted">
          Ingat kata Inggrisnya: <span className="text-brand">{word.translation_id}</span>
          <PosBadge pos={word.part_of_speech} />
        </p>
      ) : (
        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold muted">
          Kata target: <span className="text-brand">{word.text}</span> · {word.translation_id}
          <PosBadge pos={word.part_of_speech} />
        </p>
      )}

      {level === 1 && <BlankExercise word={word} onWrong={markWrong} onRight={(s) => { setFeedback({ ok: true, msg: '' }); pass(s, false) }} disabled={!!feedback?.ok || revealed} />}
      {level === 2 && <ArrangeExercise example={example} onWrong={markWrong} onRight={(s) => { setFeedback({ ok: true, msg: '' }); pass(s, false) }} disabled={!!feedback?.ok || revealed} />}
      {level === 3 && (
        <FreeExercise
          word={word}
          onWrong={(attempt, errors, arti, expl) => {
            if (firstWrong === null) setFirstWrong(attempt)
            setWrongArti(arti); setExplanation(expl); sync(errors)
          }}
          onRight={(s, bonus, corr, arti) => { sync([]); setBonusTense(bonus); setCorrected(corr); setSuccess({ sentence: s, arti }) }}
          disabled={revealed || !!success}
        />
      )}

      {success && (
        <div className="space-y-3 rounded-xl bg-success/10 p-3">
          <p className="flex items-center gap-2 font-semibold text-success"><PixelIcon name="check" size={18} /> Mantap, kalimatmu tepat</p>
          <button onClick={() => speak(success.sentence)} className="flex items-center gap-2 font-semibold text-brand"><PixelIcon name="speaker" size={16} /> {success.sentence}</button>
          {success.arti && <p className="text-sm muted">Artinya: {success.arti}</p>}
          <button onClick={() => pass(success.sentence, false)} className="btn-primary mt-1">Lanjut</button>
        </div>
      )}

      {/* Level 1 & 2: pesan tunggal + eskalasi contoh (cek lokal, satu kesalahan). */}
      {level !== 3 && feedback && !feedback.ok && (
        <div className="space-y-3">
          <p className="rounded-xl bg-coral/10 p-3 text-coral">{feedback.msg}</p>
          {feedback.arti && (
            <p className="text-sm muted">Arti kalimat yang benar: {feedback.arti}</p>
          )}
          {revealed ? (
            <div className="rounded-xl bg-black/5 p-3 dark:bg-white/5">
              <button onClick={() => speak(example)} className="flex items-center gap-2 font-semibold text-brand"><PixelIcon name="speaker" size={16} /> {example}</button>
              <p className="text-sm muted">{word.example_id}</p>
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

      {/* Level 3: checklist koreksi — perbaiki & kirim ulang, tiap yang beres dicoret. */}
      {level === 3 && !success && cards.length > 0 && (
        <div className="space-y-3">
          <CorrectionCards cards={cards} />
          {wrongArti && <p className="text-sm muted">Arti kalimat yang benar: {wrongArti}</p>}
          {revealed ? (
            <div className="rounded-xl bg-black/5 p-3 dark:bg-white/5">
              <button onClick={() => speak(example)} className="flex items-center gap-2 font-semibold text-brand"><PixelIcon name="speaker" size={16} /> {example}</button>
              <p className="text-sm muted">{word.example_id}</p>
              <button onClick={() => pass(example, true)} className="btn-primary mt-3">Lanjut</button>
            </div>
          ) : (
            <button onClick={() => setRevealed(true)} className="btn-ghost">Bingung? Lihat contoh & pelajari</button>
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
      <p className="text-sm muted">Petunjuk: artinya “{word.translation_id}” · {answer.length} huruf</p>
      <input
        value={val} disabled={disabled} onChange={(e) => setVal(e.target.value)}
        placeholder="ketik kata…"
        className="input"
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
      <div className="min-h-12 border-[3px] border-dashed border-ink/30 p-3 text-lg dark:border-white/20">
        {answer || <span className="muted">ketuk kata di bawah…</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map((c, i) => (
          <button
            key={i} disabled={disabled || pickedSet.has(i)}
            onClick={() => setPicked([...picked, i])}
            className={`border-[3px] px-4 py-2 font-semibold transition-all duration-75 ease-soft active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${pickedSet.has(i) ? 'border-ink/20 bg-black/5 text-slate-300 dark:border-white/10 dark:bg-white/5' : 'border-ink bg-brand/15 text-brand shadow-pixel-sm dark:border-white/25 dark:shadow-[2px_2px_0_0_#020617]'}`}
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
  word: Word
  onWrong: (attempt: string, errors: Koreksi[], arti?: string, explanation?: string) => void
  onRight: (s: string, bonus: boolean, corr: string | undefined, arti: string) => void
  disabled: boolean
}) {
  const [val, setVal] = useState('')
  const [busy, setBusy] = useState(false)
  // Tense yang WAJIB dipakai kalimat. '' = bebas (tanpa syarat tense).
  const [tenseKey, setTenseKey] = useState('')
  const [unlocked, setUnlocked] = useState<string[]>([])

  useEffect(() => {
    unlockedTenseKeys().then((keys) => {
      setUnlocked(keys)
      // Default = tense tempat kata ini diajarkan, bila sudah terbuka.
      const suggested = FOCUS_TO_KEY[word.tense_focus]
      if (suggested && keys.includes(suggested)) setTenseKey(suggested)
    })
  }, [word])

  const activeTense = tenseKey ? tenseByKey(tenseKey) : undefined

  async function check() {
    setBusy(true)
    try {
      const label = activeTense ? activeTense.aiLabel : word.tense_focus
      const ev = await evaluateSentence(word.text, label, val)
      const tenseOk = !activeTense || ev.sesuaiTenseTarget || detectedMatchesTense(ev.tenseDetected, activeTense.name)
      if (ev.benar && ev.pakaiKataTarget && tenseOk) {
        onRight(val, ev.bonusTense, ev.kalimatKoreksi || undefined, ev.artiKalimatId)
      } else {
        onWrong(val, buildErrors(ev, word.text, activeTense, tenseOk), ev.artiKalimatId, ev.penjelasanId)
      }
    } catch {
      onWrong(val, [{ aspek: 'koneksi', pesan: 'Koneksi bermasalah. Cek internet lalu coba lagi ya.' }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-lg">Buat kalimatmu sendiri pakai kata <b>{word.text}</b>:</p>
      {unlocked.length > 0 && (
        <label className="block text-sm">
          <span className="font-semibold muted">Tense kalimat:</span>
          <select
            value={tenseKey} disabled={disabled}
            onChange={(e) => setTenseKey(e.target.value)}
            className="input input-sm mt-1"
          >
            <option value="">Bebas (semua tense)</option>
            {TENSES.filter((t) => unlocked.includes(t.key)).map((t) => (
              <option key={t.key} value={t.key}>{t.name}</option>
            ))}
          </select>
        </label>
      )}
      {activeTense && <p className="text-xs muted">Pola: {activeTense.formula}</p>}
      <textarea
        value={val} disabled={disabled} onChange={(e) => setVal(e.target.value)} rows={2}
        placeholder="tulis kalimat bahasa Inggris…"
        className="input resize-none"
      />
      <button onClick={check} disabled={disabled || busy || !val.trim()} className="btn-primary">
        {busy ? 'Menilai…' : 'Periksa'}
      </button>
    </div>
  )
}
