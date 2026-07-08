import { create } from 'zustand'

type Theme = 'light' | 'dark'

const KEY = 'inggrisku-theme'

function preferred(): Theme {
  const saved = localStorage.getItem(KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function paint(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

/** Dipanggil sekali sebelum render agar tidak ada flash tema. */
export function applyStoredTheme() {
  paint(preferred())
}

interface ThemeState {
  theme: Theme
  toggle: () => void
}

export const useTheme = create<ThemeState>((set, get) => ({
  theme: preferred(),
  toggle: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem(KEY, next)
    paint(next)
    set({ theme: next })
  },
}))
