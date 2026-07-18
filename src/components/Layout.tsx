import { NavLink, Outlet } from 'react-router-dom'
import { useTheme } from '../store/theme'
import { PixelIcon, type PixelIconName } from './PixelIcon'

const nav: { to: string; label: string; icon: PixelIconName }[] = [
  { to: '/dashboard', label: 'Beranda', icon: 'home' },
  { to: '/belajar', label: 'Belajar', icon: 'books' },
  { to: '/review', label: 'Review', icon: 'repeat' },
  { to: '/kosakata', label: 'Kosakata', icon: 'book' },
  { to: '/koreksi', label: 'Koreksi', icon: 'pencil' },
  { to: '/progres', label: 'Progres', icon: 'chart' },
  { to: '/settings', label: 'Setelan', icon: 'gear' },
]
// Mobile bottom nav: 6 item terpenting (Koreksi lewat sidebar / Beranda).
const mobileNav = nav.filter((n) => n.to !== '/koreksi')

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      aria-label="Ganti tema terang/gelap"
      className="border-[3px] border-ink p-2 text-xl transition-all duration-75 ease-soft hover:bg-black/5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none dark:border-white/25 dark:hover:bg-white/10 shadow-pixel-sm dark:shadow-[2px_2px_0_0_#020617] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <PixelIcon name={theme === 'dark' ? 'sun' : 'moon'} size={20} />
    </button>
  )
}

// Mobile-first: konten satu kolom + bottom nav. Desktop (md+): sidebar kiri.
export default function Layout() {
  return (
    <div className="min-h-dvh md:flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-black/5 md:dark:border-white/10 md:p-4">
        <div className="mb-6 flex items-center justify-between">
          <span className="pixel-title text-sm text-brand">InggrisKu</span>
          <ThemeToggle />
        </div>
        <nav className="flex flex-col gap-1">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} className={navItem}>
              <PixelIcon name={n.icon} size={20} /> {n.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Header mobile */}
      <header className="flex items-center justify-between border-b border-black/5 p-4 dark:border-white/10 md:hidden">
        <span className="pixel-title text-xs text-brand">InggrisKu</span>
        <ThemeToggle />
      </header>

      {/* Konten: dibatasi lebar & di tengah untuk keterbacaan */}
      <main className="mx-auto w-full max-w-2xl flex-1 p-4 pb-24 md:p-8 md:pb-8">
        <Outlet />
      </main>

      {/* Bottom nav mobile */}
      {/* Solid, tanpa backdrop-blur — kaca buram itu bahasa desain modern, bukan 8-bit. */}
      <nav className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-6 border-t-[3px] border-ink bg-white dark:border-white/25 dark:bg-slate-800 md:hidden">
        {mobileNav.map((n) => (
          <NavLink key={n.to} to={n.to} className={bottomItem}>
            <PixelIcon name={n.icon} size={20} />
            <span className="text-[10px]">{n.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

const navItem = ({ isActive }: { isActive: boolean }) =>
  // Item aktif = kotak bergaris tebal + bayangan keras (kursor menu game).
  `flex items-center gap-3 border-[3px] px-3 py-2 font-semibold transition-all duration-75 ease-soft ${
    isActive
      ? 'border-ink bg-brand/15 text-brand shadow-pixel-sm dark:border-white/25 dark:shadow-[2px_2px_0_0_#020617]'
      : 'border-transparent text-slate-600 hover:border-ink/20 hover:bg-black/5 dark:text-slate-300 dark:hover:border-white/15 dark:hover:bg-white/5'
  }`

const bottomItem = ({ isActive }: { isActive: boolean }) =>
  `flex flex-col items-center gap-0.5 py-2 transition duration-200 ease-soft ${isActive ? 'text-brand' : 'muted'}`
