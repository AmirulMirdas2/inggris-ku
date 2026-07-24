import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { detectedMatchesTense, type TenseInfo } from '../../lib/tenses'
import { evaluateSentence, fetchWordPool, type PoolWord } from '../../lib/api'
import { speak } from '../../lib/audio'
import { sfxCorrect } from '../../lib/sfx'
import { PixelIcon } from '../PixelIcon'
import { PosBadge } from '../PosBadge'
import { CorrectionCards, buildErrors, useCorrectionCards } from '../CorrectionCards'

// Tahap "Produksi" — SATU-SATUNYA bagian tense yang memakai AI.
// Lolos hanya bila kalimat: benar + pakai kata target + BENAR-BENAR tense ini
// (ev.sesuaiTenseTarget). Kalimat beda-tense ditolak dengan pesan yang jelas.

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

export default function TenseProduce({
  tense, onCorrect, requireThirdPerson = false,
}: { tense: TenseInfo; onCorrect: (usedHint: boolean) => void; requireThirdPerson?: boolean }) {
  // Tantangan pertama: wajib pakai she/he/it (baru boleh lanjut kalimat bebas).
  const [challengeDone, setChallengeDone] = useState(false)
  const challengeOn = requireThirdPerson && !challengeDone
  const [pool, setPool] = useState<PoolWord[] | null>(null)
  useEffect(() => { fetchWordPool().then(setPool).catch(() => setPool([])) }, [])

  const [seed, setSeed] = useState(0) // ganti kata → ganti seed
  const word = useMemo(() => (pool && pool.length ? pick(pool) : null), [pool, seed])
  // Contoh he/she/it milik tense ini (untuk banner tantangan), diambil dari daftar contohnya.
  const thirdPersonEg = useMemo(() => tense.examples.find((e) => /\b(he|she|it)\b/i.test(e.en))?.en, [tense])

  const [val, setVal] = useState('')
  const [busy, setBusy] = useState(false)
  const { cards, sync, reset: resetCards } = useCorrectionCards()
  const [wrongArti, setWrongArti] = useState<string | undefined>()
  const [ok, setOk] = useState<{ sentence: string; arti: string } | null>(null)
  const [triedWrong, setTriedWrong] = useState(false)
  const hasActive = cards.some((c) => !c.fixed)

  async function check() {
    if (!val.trim()) return
    // Gerbang tantangan: cek lokal dulu (tanpa AI) bahwa subjeknya she/he/it.
    if (challengeOn && !/\b(he|she|it)\b/i.test(val)) {
      setTriedWrong(true); setWrongArti(undefined)
      sync([{ aspek: 'orang-ketiga', pesan: 'Tantangan ini WAJIB memakai she, he, atau it sebagai subjek. Perhatikan bentuk orang ketiga tunggal.' }])
      return
    }
    setBusy(true)
    try {
      // Target kata opsional secara makna, tapi evaluate-sentence butuh sebuah
      // kata; kalau pool kosong, pakai kata pertama dari kalimat siswa.
      const target = word?.text ?? val.trim().split(/\s+/)[0] ?? 'it'
      const ev = await evaluateSentence(target, tense.aiLabel, val)
      // Percayai deteksi konkret bila cocok target (hindari "ubah ke X padahal sudah X").
      const tenseOk = ev.sesuaiTenseTarget || detectedMatchesTense(ev.tenseDetected, tense.name)
      if (ev.benar && ev.pakaiKataTarget && tenseOk) {
        sync([]) // coret semua kartu koreksi
        if (challengeOn) setChallengeDone(true)
        sfxCorrect()
        setOk({ sentence: ev.kalimatKoreksi || val, arti: ev.artiKalimatId })
      } else {
        setTriedWrong(true); setWrongArti(ev.artiKalimatId)
        sync(buildErrors(ev, target, tense, tenseOk))
      }
    } catch {
      sync([{ aspek: 'koneksi', pesan: 'Koneksi bermasalah. Cek internet lalu coba lagi ya.' }])
    } finally {
      setBusy(false)
    }
  }

  function reset(nextWord: boolean) {
    setVal(''); resetCards(); setWrongArti(undefined); setOk(null); setTriedWrong(false)
    if (nextWord) setSeed((s) => s + 1)
  }

  if (!pool) return <div className="card"><p className="muted">Menyiapkan latihan…</p></div>

  return (
    <motion.div
      key={seed}
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.6, 0, 0.4, 1] }}
      className={`card space-y-4 ${hasActive ? 'shake border-2 border-coral' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold muted">Buat kalimat <span className="text-brand">{tense.name}</span></p>
        <span className="tnum border-[3px] border-ink bg-gold px-2 py-0.5 text-xs font-bold text-ink dark:border-white/25">{tense.formula}</span>
      </div>

      {challengeOn && !ok && (
        <div className="border-[3px] border-ink bg-accent/20 p-3 dark:border-white/25">
          <p className="flex items-center gap-2 font-bold text-ink dark:text-slate-100"><PixelIcon name="target" size={16} /> Tantangan: pakai she / he / it</p>
          <p className="mt-1 text-xs muted">
            Orang ketiga tunggal titik tersulit — selesaikan satu kalimat {tense.name} dengan he/she/it dulu, baru lanjut bebas. Pola: {tense.formula}.
            {thirdPersonEg && <> Contoh: <i>{thirdPersonEg}</i></>}
          </p>
        </div>
      )}

      {word && (
        <div className="flex items-center justify-between gap-2 border-[3px] border-ink bg-white p-3 dark:border-white/25 dark:bg-slate-800">
          <p className="flex flex-wrap items-center gap-2 text-sm">Pakai kata: <b className="text-brand">{word.text}</b> · {word.translation_id} <PosBadge pos={word.pos} /></p>
          <button onClick={() => reset(true)} className="flex items-center gap-1 text-xs font-semibold text-accent">
            <PixelIcon name="repeat" size={14} /> ganti
          </button>
        </div>
      )}

      {ok ? (
        <div className="space-y-3 bg-success/10 p-3">
          <p className="flex items-center gap-2 font-semibold text-success"><PixelIcon name="check" size={18} /> Mantap, ini {tense.name}!</p>
          <button onClick={() => speak(ok.sentence)} className="flex items-center gap-2 font-semibold text-brand"><PixelIcon name="speaker" size={16} /> {ok.sentence}</button>
          {ok.arti && <p className="text-sm muted">Artinya: {ok.arti}</p>}
          <button onClick={() => { const uh = triedWrong; reset(true); onCorrect(uh) }} className="btn-primary mt-1">Lanjut</button>
        </div>
      ) : (
        <>
          <textarea
            value={val} onChange={(e) => setVal(e.target.value)} rows={2} disabled={busy}
            placeholder={challengeOn ? `mis. ${thirdPersonEg ?? 'She …'}` : `tulis kalimat ${tense.name}…`}
            className="input resize-none"
          />
          <button onClick={check} disabled={busy || !val.trim()} className="btn-primary">
            {busy ? 'Menilai…' : 'Periksa'}
          </button>
        </>
      )}

      {!ok && cards.length > 0 && (
        <div className="space-y-2">
          <CorrectionCards cards={cards} />
          {wrongArti && <p className="text-sm muted">Arti kalimat yang benar: {wrongArti}</p>}
        </div>
      )}
    </motion.div>
  )
}
