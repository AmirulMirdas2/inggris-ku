import { useState } from 'react'
import type { Evaluation, Koreksi } from '../lib/types'
import { PixelIcon } from './PixelIcon'

// Terjemahkan hasil evaluate-sentence jadi daftar koreksi ber-aspek. Target &
// tense disintesis di sini supaya selaras dengan gerbang lolos; sisanya dari AI.
export function buildErrors(
  ev: Evaluation, target: string, tense?: { name: string; formula: string }, tenseOk = true,
): Koreksi[] {
  const errs: Koreksi[] = []
  if (!ev.pakaiKataTarget) errs.push({ aspek: 'kata-target', pesan: `Belum memakai kata "${target}". Sisipkan ke kalimatmu.` })
  if (tense && !tenseOk) errs.push({ aspek: 'tense', pesan: `Ini ${ev.tenseDetected || 'tense lain'} — ubah ke ${tense.name}, pola: ${tense.formula}.` })
  for (const k of ev.koreksiList ?? []) if (k?.aspek && k?.pesan) errs.push(k)
  if (!errs.length) errs.push({ aspek: 'lainnya', pesan: ev.penjelasanId || 'Belum tepat, coba perbaiki sedikit.' })
  return errs
}

// Checklist koreksi: tiap kesalahan = satu kartu. Saat siswa memperbaiki kalimat
// dan mengirim ulang, kartu yang kesalahannya hilang dicoret (fixed), yang masih
// ada di-update, dan kesalahan baru ditambah. Semua benar → semua kartu tercoret.
export interface CorrectionCard extends Koreksi {
  fixed: boolean
}

// Cocokkan koreksi lama dengan yang baru lewat `aspek` (kunci stabil dari AI).
// Murni & diuji: prev + errors sekarang → daftar kartu berikutnya.
export function syncCards(prev: CorrectionCard[], errors: Koreksi[]): CorrectionCard[] {
  // Anggap semua lama sudah beres, lalu hidupkan lagi yang masih muncul.
  const next: CorrectionCard[] = prev.map((c) => ({ ...c, fixed: true }))
  const byAspek = new Map(next.map((c) => [c.aspek, c]))
  for (const e of errors) {
    const hit = byAspek.get(e.aspek)
    if (hit) { hit.fixed = false; hit.pesan = e.pesan }
    else { const card = { ...e, fixed: false }; next.push(card); byAspek.set(e.aspek, card) }
  }
  return next
}

export function useCorrectionCards() {
  const [cards, setCards] = useState<CorrectionCard[]>([])
  return {
    cards,
    sync: (errors: Koreksi[]) => setCards((prev) => syncCards(prev, errors)),
    reset: () => setCards([]),
  }
}

export function CorrectionCards({ cards }: { cards: CorrectionCard[] }) {
  if (!cards.length) return null
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold muted">Perbaiki satu per satu, lalu kirim ulang:</p>
      {cards.map((c) => (
        <div
          key={c.aspek}
          className={`flex items-start gap-2 border-[3px] p-3 ${
            c.fixed
              ? 'border-success/40 bg-success/10 dark:border-success/40'
              : 'border-ink bg-coral/10 dark:border-white/25'
          }`}
        >
          <PixelIcon name={c.fixed ? 'check' : 'target'} size={16} className={c.fixed ? 'text-success' : 'text-coral'} />
          <p className={`text-sm ${c.fixed ? 'text-success line-through' : 'text-coral'}`}>{c.pesan}</p>
        </div>
      ))}
    </div>
  )
}
