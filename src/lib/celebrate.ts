import confetti from 'canvas-confetti'
import { buzz } from './audio'
import { sfxCorrect, sfxFanfare } from './sfx'

// Konfeti pun ikut 8-bit: partikel kotak, bukan bulat, dan pakai palet PICO-8.
const COLORS = ['#00C46A', '#00E436', '#FFA300', '#FFEC27', '#29ADFF']

export function celebrate() {
  confetti({
    particleCount: 60, spread: 70, origin: { y: 0.7 }, colors: COLORS,
    shapes: ['square'], scalar: 1.2, disableForReducedMotion: true,
  })
  sfxCorrect()
  buzz(30)
}

// Momen "kata dikuasai": ledakan lebih besar, dua meriam samping.
export function celebrateMastered() {
  const pixel = { colors: COLORS, shapes: ['square' as const], scalar: 1.2, disableForReducedMotion: true }
  confetti({ particleCount: 120, spread: 100, startVelocity: 45, origin: { y: 0.65 }, ...pixel })
  confetti({ particleCount: 50, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, ...pixel })
  confetti({ particleCount: 50, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, ...pixel })
  sfxFanfare()
  buzz([40, 30, 60])
}
