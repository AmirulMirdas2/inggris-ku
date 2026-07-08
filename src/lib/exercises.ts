// Helper latihan produksi — murni, dicek lokal untuk Level 1 & 2.

export type Level = 1 | 2 | 3

// ponytail: level dari minggu tema. Naikkan per-kemampuan nanti bila perlu.
export function levelForWeek(week: number): Level {
  if (week <= 2) return 1
  if (week <= 4) return 2
  return 3
}

/** Samakan kalimat untuk perbandingan longgar (abaikan huruf besar & tanda baca). */
export function normalize(s: string): string {
  return s.toLowerCase().replace(/[.,!?;:'"]/g, '').replace(/\s+/g, ' ').trim()
}

/** Ganti kemunculan pertama kata target dengan "___" untuk isi rumpang. */
export function blankSentence(sentence: string, word: string): { prompt: string; answer: string } {
  const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
  const m = sentence.match(re)
  if (!m) return { prompt: `${sentence} (isi: ${word})`, answer: word }
  return { prompt: sentence.replace(re, '___'), answer: m[0] }
}

/** Pecah kalimat jadi token kata untuk latihan susun-kata. */
export function tokenize(sentence: string): string[] {
  return sentence.replace(/[.,!?;:]/g, '').split(/\s+/).filter(Boolean)
}

/** Acak sampai berbeda dari urutan asli (bila mungkin). */
export function shuffle<T>(arr: T[]): T[] {
  if (arr.length < 2) return [...arr]
  let out = [...arr]
  const same = () => out.every((v, i) => v === arr[i])
  do {
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[out[i], out[j]] = [out[j], out[i]]
    }
  } while (same())
  return out
}

/** Cek Level 1: jawaban rumpang cocok dengan kata target. */
export function checkBlank(input: string, answer: string): boolean {
  return normalize(input) === normalize(answer)
}

/** Cek Level 2: susunan token sama dengan kalimat asli. */
export function checkArrange(tokens: string[], original: string): boolean {
  return normalize(tokens.join(' ')) === normalize(original)
}
