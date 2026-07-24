import { supabase } from './supabase'
import { schedule, bucketDueDates, type SrsState } from './srs'
import { MASTER_AT, TENSES, isUnlocked } from './tenses'
import { isCrossTenseTarget } from './exercises'
import type { Word, ReviewCard, Profile, Evaluation, TenseProgress } from './types'

/** Tanggal lokal (YYYY-MM-DD) pada timezone pengguna. */
export function todayIn(tz: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date())
}

// ---------- Kata & kartu ----------

/** Kata baru: dalam minggu berjalan, belum punya kartu SRS. */
export async function fetchNewWords(week: number, limit: number): Promise<Word[]> {
  const run = async () => {
    const { data: cards } = await supabase.from('review_cards').select('word_id')
    const known = (cards ?? []).map((c) => c.word_id)
    let q = supabase.from('words').select('*').lte('theme_week', week)
      .order('theme_week').order('frequency_rank', { nullsFirst: false }).limit(limit)
    if (known.length) q = q.not('id', 'in', `(${known.join(',')})`)
    const { data, error } = await q
    if (error) throw error
    return (data ?? []) as Word[]
  }

  let words = await run()
  // Minggu 6+ tidak di-seed manual. Bila belum ada satu pun kata untuk minggu itu,
  // AI meng-generate lalu cache ke tabel words, baru diambil ulang. Sekali generate
  // dipakai semua pengguna. Cek theme_week (bukan words.length) supaya tak generate
  // ulang hanya karena pengguna ini sudah mengenal semuanya.
  if (words.length === 0 && week >= 6) {
    const { count } = await supabase.from('words')
      .select('id', { count: 'exact', head: true }).eq('theme_week', week)
    if (!count) {
      await supabase.functions.invoke('generate-words', { body: { week } })
      words = await run()
    }
  }
  return words
}

/** Kartu jatuh tempo hari ini (belum mastered), dengan datanya. */
export async function fetchDueCards(today: string): Promise<{ card: ReviewCard; word: Word }[]> {
  const { data, error } = await supabase
    .from('review_cards')
    .select('*, word:words(*)')
    .lte('due_date', today)
    .neq('status', 'mastered')
    .order('due_date')
  if (error) throw error
  return (data ?? []).map((r: any) => ({ card: r as ReviewCard, word: r.word as Word }))
}

export async function fetchCard(userId: string, wordId: number): Promise<ReviewCard | null> {
  const { data } = await supabase.from('review_cards').select('*')
    .eq('user_id', userId).eq('word_id', wordId).maybeSingle()
  return (data as ReviewCard) ?? null
}

/** Terapkan hasil review 1 kata: hitung SRS, simpan kartu, kembalikan status. */
export async function applyReview(opts: {
  userId: string
  word: Word
  quality: number
  today: string
  prev?: ReviewCard | null
}): Promise<{ becameMastered: boolean }> {
  const { userId, word, quality, today, prev } = opts
  const prevState: SrsState | undefined = prev
    ? { ease_factor: prev.ease_factor, interval_days: prev.interval_days, repetitions: prev.repetitions }
    : undefined
  const next = schedule(prevState, quality, today)

  const { error } = await supabase.from('review_cards').upsert(
    {
      user_id: userId,
      word_id: word.id,
      ease_factor: next.ease_factor,
      interval_days: next.interval_days,
      repetitions: next.repetitions,
      due_date: next.due_date,
      last_reviewed: new Date().toISOString(),
      status: next.status,
    },
    { onConflict: 'user_id,word_id' },
  )
  if (error) throw error
  return { becameMastered: next.status === 'mastered' && prev?.status !== 'mastered' }
}

// ---------- Statistik progres ----------

export interface WeekProgress { week: number; total: number; mastered: number; learning: number }

/** Rekap per minggu tema: total kata, sudah dikuasai, sedang dipelajari. */
export async function fetchProgressByWeek(): Promise<WeekProgress[]> {
  const [{ data: words }, { data: cards }] = await Promise.all([
    supabase.from('words').select('id, theme_week'),
    supabase.from('review_cards').select('word_id, status'), // RLS → hanya milik user
  ])
  const status = new Map((cards ?? []).map((c: any) => [c.word_id, c.status]))
  const byWeek = new Map<number, WeekProgress>()
  for (const w of words ?? []) {
    const wk = (w as any).theme_week as number
    const row = byWeek.get(wk) ?? { week: wk, total: 0, mastered: 0, learning: 0 }
    row.total++
    const st = status.get((w as any).id)
    if (st === 'mastered') row.mastered++
    else if (st === 'learning') row.learning++
    byWeek.set(wk, row)
  }
  return [...byWeek.values()].sort((a, b) => a.week - b.week)
}

export interface StudiedWord {
  text: string; translation_id: string; phonetic: string | null
  part_of_speech: string | null
  last_reviewed: string; status: 'learning' | 'mastered'
  due_date: string; interval_days: number
}

/** Semua kata yang sudah dipelajari (learning + mastered), terbaru dulu. */
export async function fetchStudiedWords(): Promise<StudiedWord[]> {
  const { data } = await supabase.from('review_cards')
    .select('last_reviewed, status, due_date, interval_days, word:words(text, translation_id, phonetic, part_of_speech)')
    .order('last_reviewed', { ascending: false })
  return (data ?? []).map((r: any) => ({
    text: r.word.text, translation_id: r.word.translation_id, phonetic: r.word.phonetic,
    part_of_speech: r.word.part_of_speech,
    last_reviewed: r.last_reviewed, status: r.status,
    due_date: r.due_date, interval_days: r.interval_days,
  })).filter((w: StudiedWord) => w.last_reviewed)
}

/** Buka minggu berikutnya secara manual (untuk yang tak sabar). */
export async function advanceWeek(profile: Profile): Promise<Profile> {
  const current_week = profile.current_week + 1
  const { data } = await supabase.from('profiles')
    .update({ current_week }).eq('id', profile.id).select().single()
  return (data as Profile) ?? { ...profile, current_week }
}

export interface ForecastDay { date: string; count: number }
export interface ReviewForecast {
  overdue: number       // jatuh tempo sebelum hari ini — menumpuk, belum dikerjakan
  days: ForecastDay[]   // hari ini + (span-1) hari ke depan
  beyond: number        // dijadwalkan setelah rentang grafik
  scheduled: number     // total kartu yang masih akan direview
}

/** Peramalan beban review. Kartu 'mastered' TIDAK dihitung: fetchDueCards
 *  mengecualikannya, jadi kata yang sudah dikuasai memang tak pernah muncul
 *  lagi — menampilkannya di jadwal akan jadi janji palsu. */
export async function fetchReviewForecast(today: string, span = 14): Promise<ReviewForecast> {
  const { data } = await supabase.from('review_cards')
    .select('due_date').neq('status', 'mastered')
  const dues = (data ?? []).map((r: any) => r.due_date as string)
  return { ...bucketDueDates(dues, today, span), scheduled: dues.length }
}

// ---------- Riwayat & koreksi ----------

export async function recordAttempt(opts: {
  userId: string; wordId: number; sentence: string; correct: boolean
  corrected?: string; explanation?: string; tense?: string; bonus?: boolean
}) {
  await supabase.from('sentence_attempts').insert({
    user_id: opts.userId, word_id: opts.wordId, sentence_text: opts.sentence,
    is_correct: opts.correct, corrected_text: opts.corrected, explanation_id: opts.explanation,
    tense_detected: opts.tense, bonus_earned: opts.bonus ?? false,
  })
}

export async function addError(opts: {
  userId: string; wordId: number; wrong: string; correction?: string; explanation?: string; today: string
}) {
  await supabase.from('error_entries').insert({
    user_id: opts.userId, word_id: opts.wordId, wrong_sentence: opts.wrong,
    correction: opts.correction, explanation_id: opts.explanation, next_review: opts.today,
  })
}

export async function fetchErrors(today: string) {
  const { data } = await supabase.from('error_entries')
    .select('*, word:words(*)').eq('resolved', false).lte('next_review', today)
    .order('next_review')
  return (data ?? []) as any[]
}

export async function resolveError(id: number) {
  await supabase.from('error_entries').update({ resolved: true }).eq('id', id)
}

// ---------- Gamifikasi ----------

/** XP untuk satu kata benar. */
export function xpFor(correct: boolean, usedHint: boolean, bonusTense: boolean): number {
  if (!correct) return 0
  return 10 + (usedHint ? 0 : 5) + (bonusTense ? 5 : 0)
}

/** Update XP, streak jujur, mastered, dan naik-minggu. Kembalikan profil baru. */
export async function bumpProgress(opts: {
  profile: Profile; addXp: number; masteredDelta: number; today: string
}): Promise<Profile> {
  const { profile, addXp, masteredDelta, today } = opts
  let streak = profile.streak_days
  if (profile.last_active_date !== today) {
    const y = new Date(today + 'T00:00:00Z'); y.setUTCDate(y.getUTCDate() - 1)
    const yesterday = y.toISOString().slice(0, 10)
    streak = profile.last_active_date === yesterday ? streak + 1 : 1
  }
  const words_mastered = profile.words_mastered + masteredDelta
  // ponytail: naik minggu tiap ~10 kata dikuasai; ganti aturan bila terlalu kasar.
  const current_week = Math.max(profile.current_week, Math.floor(words_mastered / 10) + 1)

  const patch = {
    xp: profile.xp + addXp,
    streak_days: streak,
    last_active_date: today,
    words_mastered,
    current_week,
  }
  const { data } = await supabase.from('profiles').update(patch).eq('id', profile.id).select().single()
  return (data as Profile) ?? { ...profile, ...patch }
}

// ---------- LLM ----------

/** Panggil Edge Function evaluate-sentence (proxy Anthropic). */
export async function evaluateSentence(word: string, tenseFocus: string, sentence: string): Promise<Evaluation> {
  const { data, error } = await supabase.functions.invoke('evaluate-sentence', {
    body: { word, tenseFocus, sentence },
  })
  if (error) throw error
  return data as Evaluation
}

// ---------- Belajar tense ----------

export interface PoolWord { text: string; translation_id: string; pos: string | null }

/** Kata target latihan tense = kosakata yang SUDAH dipelajari user (punya kartu
 *  SRS). Kata fungsi (the, a, is) dilewati — sulit jadi kalimat mandiri. Kosong
 *  bila user belum belajar kata apa pun; TenseProduce menangani itu. */
export async function fetchWordPool(limit = 60): Promise<PoolWord[]> {
  const { data } = await supabase.from('review_cards')
    .select('word:words(text, translation_id, part_of_speech, tense_focus)')
    .order('last_reviewed', { ascending: false })
    .limit(limit)
  return (data ?? [])
    .map((r: any) => r.word)
    // Hanya kata yang bisa dipakai di tense mana pun (lihat isCrossTenseTarget):
    // "was"/"going" ditolak karena bentuknya terkunci ke satu waktu.
    .filter((w: any) => w && isCrossTenseTarget(w.part_of_speech, w.text, w.tense_focus))
    .map((w: any) => ({ text: w.text, translation_id: w.translation_id, pos: w.part_of_speech })) as PoolWord[]
}

/** Progress semua tense pengguna, dipetakan per tense_key. */
export async function fetchTenseProgress(): Promise<Record<string, TenseProgress>> {
  const { data } = await supabase.from('tense_progress').select('*')
  const map: Record<string, TenseProgress> = {}
  for (const r of (data ?? []) as TenseProgress[]) map[r.tense_key] = r
  return map
}

/** Tandai tahap "Kenali" lulus untuk satu tense. */
export async function markTenseUnderstood(userId: string, tenseKey: string): Promise<void> {
  const { error } = await supabase.from('tense_progress').upsert(
    { user_id: userId, tense_key: tenseKey, understood: true },
    { onConflict: 'user_id,tense_key' },
  )
  if (error) throw error
}

/** Catat satu kalimat produksi yang BENAR. Naikkan correct_count; saat menyentuh
 *  MASTER_AT pertama kali → status 'mastered' + masuk SRS (due_date via schedule). */
export async function recordTenseCorrect(userId: string, tenseKey: string, today: string): Promise<TenseProgress> {
  const { data: cur } = await supabase.from('tense_progress').select('*')
    .eq('user_id', userId).eq('tense_key', tenseKey).maybeSingle()
  const prev = cur as TenseProgress | null
  const correct_count = (prev?.correct_count ?? 0) + 1

  // upsert parsial: hanya kolom yang disebut yang di-update, sisanya utuh.
  const patch: Record<string, unknown> = {
    user_id: userId, tense_key: tenseKey, correct_count, understood: true,
  }
  if (correct_count >= MASTER_AT && prev?.status !== 'mastered') {
    const next = schedule(undefined, 5, today) // mulai jadwal SRS dari nol
    patch.status = 'mastered'
    patch.ease_factor = next.ease_factor
    patch.interval_days = next.interval_days
    patch.repetitions = next.repetitions
    patch.due_date = next.due_date
    patch.last_reviewed = new Date().toISOString()
  }

  const { data, error } = await supabase.from('tense_progress')
    .upsert(patch, { onConflict: 'user_id,tense_key' }).select().single()
  if (error) throw error
  return data as TenseProgress
}

// Cache 1x per sesi: tense yang sudah terbuka, untuk pemilih tense di latihan
// kosakata/review. Bisa basi bila user membuka tense baru di tengah sesi —
// refresh membersihkannya (dampak kecil).
let _unlocked: Promise<string[]> | null = null
export function unlockedTenseKeys(): Promise<string[]> {
  if (!_unlocked) {
    _unlocked = fetchTenseProgress()
      .then((m) => TENSES.filter((t) => isUnlocked(t.order, m)).map((t) => t.key))
      .catch(() => ['presentSimple']) // minimal: tense pertama selalu terbuka
  }
  return _unlocked
}

/** Terapkan hasil review SRS satu tense (setelah mastered) → jadwalkan ulang. */
export async function reviewTenseCard(userId: string, tenseKey: string, quality: number, today: string): Promise<void> {
  const { data: cur } = await supabase.from('tense_progress').select('*')
    .eq('user_id', userId).eq('tense_key', tenseKey).maybeSingle()
  const prev = cur as TenseProgress | null
  const prevState: SrsState | undefined = prev
    ? { ease_factor: prev.ease_factor, interval_days: prev.interval_days, repetitions: prev.repetitions }
    : undefined
  const next = schedule(prevState, quality, today)
  const { error } = await supabase.from('tense_progress').upsert(
    {
      user_id: userId, tense_key: tenseKey, status: 'mastered',
      ease_factor: next.ease_factor, interval_days: next.interval_days,
      repetitions: next.repetitions, due_date: next.due_date,
      last_reviewed: new Date().toISOString(),
    },
    { onConflict: 'user_id,tense_key' },
  )
  if (error) throw error
}
