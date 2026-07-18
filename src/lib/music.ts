import { audio } from './sfx'

// Musik latar chiptune — disintesis, bukan file aset. Loop 16 langkah di A minor
// pentatonik dengan bass mengikuti Am–F–C–G.
//
// Penjadwalan pakai pola "lookahead": setInterval hanya MENJADWALKAN not ke
// AudioContext beberapa ratus ms di depan, tidak membunyikannya langsung.
// setTimeout per not akan melenceng terdengar (drift) begitu tab tidak fokus.

const KEY = 'inggrisku-music'
export const musicEnabled = () => localStorage.getItem(KEY) !== 'off'
export function setMusicEnabled(on: boolean) {
  localStorage.setItem(KEY, on ? 'on' : 'off')
  if (on) startMusic()
  else stopMusic()
}

const BPM = 100
const STEP = 30 / BPM // durasi 1/8 not dalam detik
const MELODY = [0, 7, 3, 7, 5, 12, 10, 7, 0, 7, 3, 7, 10, 5, 3, 0]
const BASS = [-12, -16, -9, -14] // A3, F3, C4, G3 — satu not tiap setengah bar
const hz = (semitone: number) => 440 * Math.pow(2, semitone / 12)

let timer: number | undefined
let master: GainNode | null = null
let nextTime = 0
let step = 0
let suppressed = false // true selama sesi latihan berjalan

function voice(ac: AudioContext, freq: number, at: number, dur: number, type: OscillatorType, peak: number) {
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, at)
  gain.gain.setValueAtTime(peak, at)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  osc.connect(gain).connect(master!)
  osc.start(at)
  osc.stop(at + dur)
}

function tick() {
  const ac = audio()
  if (!ac || !master) return
  while (nextTime < ac.currentTime + 0.2) {
    const s = step % 16
    voice(ac, hz(MELODY[s]), nextTime, STEP * 0.85, 'square', 0.5)
    if (s % 4 === 0) voice(ac, hz(BASS[s / 4]), nextTime, STEP * 3.5, 'triangle', 0.8)
    nextTime += STEP
    step++
  }
}

export function startMusic() {
  if (timer !== undefined || suppressed || !musicEnabled()) return
  const ac = audio()
  if (!ac) return
  master = ac.createGain()
  master.gain.value = 0.03 // latar harus jauh lebih pelan dari SFX
  master.connect(ac.destination)
  nextTime = ac.currentTime + 0.1
  step = 0
  timer = window.setInterval(tick, 25)
}

export function stopMusic() {
  if (timer !== undefined) window.clearInterval(timer)
  timer = undefined
  master?.disconnect()
  master = null
}

/** Sesi latihan dimulai: musik senyap, sisakan SFX + bunyi ketikan saja. */
export const suppressMusic = () => { suppressed = true; stopMusic() }
/** Sesi selesai: musik boleh jalan lagi. */
export const releaseMusic = () => { suppressed = false; startMusic() }

// Jangan bunyi saat tab ditinggalkan.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopMusic()
    else startMusic()
  })
}
