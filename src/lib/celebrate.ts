import confetti from 'canvas-confetti'
import { buzz } from './audio'

// "Ding" lembut via WebAudio — tanpa file aset.
function ding() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35)
    osc.start(); osc.stop(ctx.currentTime + 0.35)
  } catch { /* audio bisa diblok sebelum interaksi — abaikan */ }
}

export function celebrate() {
  confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 }, disableForReducedMotion: true })
  ding()
  buzz(30)
}

// Momen "kata dikuasai": ledakan lebih besar, dua meriam samping, warna brand.
export function celebrateMastered() {
  const colors = ['#1D9E75', '#EF9F27', '#639922']
  confetti({ particleCount: 120, spread: 100, startVelocity: 45, origin: { y: 0.65 }, colors, disableForReducedMotion: true })
  confetti({ particleCount: 50, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors, disableForReducedMotion: true })
  confetti({ particleCount: 50, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors, disableForReducedMotion: true })
  ding()
  buzz([40, 30, 60])
}
