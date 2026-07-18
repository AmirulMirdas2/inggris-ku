// Chiptune SFX: gelombang kotak pendek ala konsol 8-bit. Tanpa file aset.
// Satu AudioContext dipakai ulang; dibuat malas karena browser memblokir
// audio sebelum ada interaksi pengguna.

const KEY = 'inggrisku-sfx'
export const sfxEnabled = () => localStorage.getItem(KEY) !== 'off'
export const setSfxEnabled = (on: boolean) => localStorage.setItem(KEY, on ? 'on' : 'off')

let ctx: AudioContext | null = null
export function audio(): AudioContext | null {
  try {
    ctx ??= new (window.AudioContext || (window as any).webkitAudioContext)()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null // audio diblok — fitur suara sekadar mati, jangan lempar
  }
}

/** Satu nada kotak. delay dalam detik untuk merangkai arpeggio. */
export function blip(freq = 440, ms = 60, delay = 0, gainPeak = 0.05) {
  if (!sfxEnabled()) return
  const ac = audio()
  if (!ac) return
  const t = ac.currentTime + delay
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(freq, t)
  // Attack instan + decay eksponensial = "pluck" khas chip, bukan beep datar.
  gain.gain.setValueAtTime(gainPeak, t)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000)
  osc.connect(gain).connect(ac.destination)
  osc.start(t)
  osc.stop(t + ms / 1000)
}

export const sfxClick = () => blip(660, 45)
/** Ketikan: sangat pendek & pelan, nada diacak sedikit supaya tidak terdengar
 *  seperti mesin — mengetik satu kalimat penuh harus tetap nyaman didengar. */
export const sfxType = () => blip(1100 + Math.random() * 300, 16, 0, 0.02)
export const sfxBack = () => blip(330, 55)
/** Naik C-E-G-C: jawaban benar. */
export const sfxCorrect = () => [523, 659, 784, 1047].forEach((f, i) => blip(f, 90, i * 0.06))
/** Turun dua nada: jawaban salah — jangan menghukum, cukup jelas. */
export const sfxWrong = () => { blip(311, 90); blip(233, 140, 0.09) }
/** Fanfare kata dikuasai. */
export const sfxFanfare = () =>
  [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => blip(f, 120, i * 0.08, 0.06))
