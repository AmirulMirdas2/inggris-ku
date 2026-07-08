// Tipe domain — cerminan tabel Postgres.
export type TenseFocus =
  | 'none' | 'presentSimple' | 'presentContinuous' | 'pastSimple' | 'future' | 'mixed'
export type CardStatus = 'learning' | 'mastered'

export interface Profile {
  id: string
  email: string
  display_name: string | null
  timezone: string
  reminder_enabled: boolean
  reminder_time: string
  last_reminder_date: string | null
  current_week: number
  daily_goal: number
  xp: number
  streak_days: number
  last_active_date: string | null
  words_mastered: number
}

export interface Word {
  id: number
  text: string
  translation_id: string
  phonetic: string | null
  part_of_speech: string | null
  chunk: string | null
  example_en: string | null
  example_id: string | null
  theme_week: number
  frequency_rank: number | null
  tense_focus: TenseFocus
}

export interface ReviewCard {
  id: number
  user_id: string
  word_id: number
  ease_factor: number
  interval_days: number
  repetitions: number
  due_date: string
  last_reviewed: string | null
  status: CardStatus
}

// Hasil penilaian kalimat dari Edge Function evaluate-sentence.
export interface Evaluation {
  benar: boolean
  pakaiKataTarget: boolean
  tenseDetected: string
  sesuaiTenseTarget: boolean
  kalimatKoreksi: string
  penjelasanId: string
  bonusTense: boolean
}
