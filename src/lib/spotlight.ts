// Set posisi kursor (--spot-x/--spot-y) pada .card yang sedang di-hover,
// dipakai oleh efek spotlight border di index.css. Satu listener terdelegasi.
if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointermove',
    (e) => {
      const el = (e.target as HTMLElement)?.closest?.('.card') as HTMLElement | null
      if (!el) return
      const r = el.getBoundingClientRect()
      el.style.setProperty('--spot-x', `${e.clientX - r.left}px`)
      el.style.setProperty('--spot-y', `${e.clientY - r.top}px`)
    },
    { passive: true },
  )
}
