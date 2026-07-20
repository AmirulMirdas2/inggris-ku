import { useState } from 'react'
import type { RecognitionItem, TimeFrame } from '../../lib/tenses'
import { PixelIcon } from '../PixelIcon'
import { sfxCorrect, sfxWrong } from '../../lib/sfx'

// Tahap "Kenali" — divalidasi lokal (jawaban sudah diketahui), tanpa AI.
// Pemain melewati SEMUA soal; jawaban salah menampilkan penjelasan lalu boleh
// coba lagi, jadi ia benar-benar memahami sebelum lanjut ke produksi.

const CHOICES: { value: TimeFrame; label: string }[] = [
  { value: 'sekarang', label: 'Sekarang' },
  { value: 'lampau', label: 'Masa lalu' },
  { value: 'depan', label: 'Masa depan' },
]

export default function RecognitionQuiz({ items, onPass }: { items: RecognitionItem[]; onPass: () => void }) {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<TimeFrame | null>(null)

  const item = items[idx]
  const correct = picked !== null && picked === item.answer

  function choose(v: TimeFrame) {
    if (picked) return
    setPicked(v)
    if (v === item.answer) sfxCorrect()
    else sfxWrong()
  }

  function next() {
    if (idx + 1 >= items.length) onPass()
    else { setIdx(idx + 1); setPicked(null) }
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold muted">Kalimat ini menunjuk waktu…</p>
        <span className="tnum text-xs muted">{idx + 1}/{items.length}</span>
      </div>

      <p className="text-xl font-bold">“{item.sentence}”</p>

      <div className="grid grid-cols-3 gap-2">
        {CHOICES.map((c) => {
          const isPicked = picked === c.value
          const isAnswer = item.answer === c.value
          // Setelah menjawab: hijau untuk jawaban benar, merah untuk pilihan salah.
          const state = !picked
            ? 'border-ink bg-white text-ink dark:border-white/25 dark:bg-slate-800 dark:text-slate-100'
            : isAnswer
              ? 'border-ink bg-brand text-ink'
              : isPicked
                ? 'border-ink bg-coral text-white'
                : 'border-ink/30 bg-white text-slate-400 dark:border-white/10 dark:bg-slate-800'
          return (
            <button
              key={c.value} onClick={() => choose(c.value)} disabled={!!picked}
              className={`border-[3px] px-2 py-3 text-sm font-bold transition-all duration-75 ease-soft ${state}`}
            >
              {c.label}
            </button>
          )
        })}
      </div>

      {picked && (
        <div className="space-y-3">
          <p className={`flex items-center gap-2 font-semibold ${correct ? 'text-success' : 'text-coral'}`}>
            <PixelIcon name={correct ? 'check' : 'box'} size={18} />
            {correct ? 'Tepat!' : `Belum tepat — jawabannya "${labelOf(item.answer)}".`}
          </p>
          <p className="text-sm muted">{item.why}</p>
          <button onClick={next} className="btn-primary">
            {idx + 1 >= items.length ? 'Selesai, mulai buat kalimat' : 'Lanjut'}
          </button>
        </div>
      )}
    </div>
  )
}

const labelOf = (v: TimeFrame) => CHOICES.find((c) => c.value === v)!.label
