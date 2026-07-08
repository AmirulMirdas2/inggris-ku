// Web Speech API. TTS luas didukung; STT hanya Chrome/Android → tangani anggun.

const RATE_KEY = 'inggrisku-tts-rate'
export function getTtsRate(): number {
  return Number(localStorage.getItem(RATE_KEY)) || 0.9
}
export function setTtsRate(r: number) {
  localStorage.setItem(RATE_KEY, String(r))
}

function pickEnglishVoice(): SpeechSynthesisVoice | null {
  const vs = window.speechSynthesis.getVoices()
  return vs.find((v) => v.lang === 'en-US') ?? vs.find((v) => v.lang.startsWith('en')) ?? null
}

/** true jika browser punya minimal 1 suara (sebagian OS Linux tak punya → diam). */
export function ttsHasVoices(): boolean {
  return 'speechSynthesis' in window && window.speechSynthesis.getVoices().length > 0
}

export function speak(text: string, rate = getTtsRate()) {
  if (!('speechSynthesis' in window)) return
  const synth = window.speechSynthesis
  const go = () => {
    synth.cancel() // hentikan ucapan sebelumnya
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'
    u.rate = rate
    const v = pickEnglishVoice()
    if (v) u.voice = v
    synth.speak(u)
  }
  // Suara sering dimuat async; kalau belum ada, tunggu voiceschanged sekali.
  if (synth.getVoices().length === 0) {
    synth.addEventListener('voiceschanged', go, { once: true })
    synth.getVoices() // memicu pemuatan di sebagian browser
  } else {
    go()
  }
}

// SpeechRecognition ada di webkit prefix pada Chrome.
type SR = typeof window & {
  SpeechRecognition?: any
  webkitSpeechRecognition?: any
}

export function sttSupported(): boolean {
  const w = window as SR
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition)
}

/** Rekam sekali ucapan → resolve transkrip. Reject bila tak didukung/gagal. */
export function listenOnce(): Promise<string> {
  const w = window as SR
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
  if (!Ctor) return Promise.reject(new Error('unsupported'))
  return new Promise((resolve, reject) => {
    const rec = new Ctor()
    rec.lang = 'en-US'
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.onresult = (e: any) => resolve(e.results[0][0].transcript)
    rec.onerror = (e: any) => reject(new Error(e.error))
    rec.onend = () => {} // no-op; hasil sudah lewat onresult
    rec.start()
  })
}

// Getar halus di Android (diabaikan di iOS).
export function buzz(ms = 30) {
  navigator.vibrate?.(ms)
}
