import { sfxClick, sfxType } from './sfx'
import { startMusic } from './music'

// Satu listener terdelegasi untuk SELURUH aplikasi: tiap klik pada kontrol
// memberi bunyi chip + kotak piksel yang melebar di titik kursor.
// Dipasang sekali dari main.tsx — komponen tidak perlu tahu apa-apa.
if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', (e) => {
    // Browser memblokir audio sampai ada gestur; klik pertama = izin kita.
    startMusic()

    const el = (e.target as HTMLElement)?.closest?.<HTMLElement>(
      'button, a, [role="button"], label, select, input[type="range"]',
    )
    if (!el || el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') return

    sfxClick()

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ring = document.createElement('span')
    ring.className = 'click-fx'
    ring.style.left = `${e.clientX}px`
    ring.style.top = `${e.clientY}px`
    ring.addEventListener('animationend', () => ring.remove(), { once: true })
    document.body.append(ring)
  })

  // Bunyi ketikan mekanis saat pemain mengisi jawaban. Password dilewati —
  // bunyi per-huruf di kolom sandi membocorkan panjangnya ke orang sekitar.
  document.addEventListener('keydown', (e) => {
    const el = e.target as HTMLElement | null
    if (!el) return
    const tag = el.tagName
    if (tag !== 'INPUT' && tag !== 'TEXTAREA') return
    if ((el as HTMLInputElement).type === 'password') return
    if (e.key.length === 1 || e.key === 'Backspace' || e.key === ' ') sfxType()
  })
}
