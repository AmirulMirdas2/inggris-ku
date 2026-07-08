import { NavLink, Outlet } from 'react-router-dom'
import { useTheme } from '../store/theme'

const nav = [
  { to: '/dashboard', label: 'Beranda', icon: '🏠' },
  { to: '/belajar', label: 'Belajar', icon: '📚' },
  { to: '/review', label: 'Review', icon: '🔁' },
  { to: '/kosakata', label: 'Kosakata', icon: '📖' },
  { to: '/koreksi', label: 'Koreksi', icon: '✏️' },
  { to: '/progres', label: 'Progres', icon: '📈' },
  { to: '/settings', label: 'Setelan', icon: '⚙️' },
]
// Mobile bottom nav: 6 item terpenting (Koreksi lewat sidebar / Beranda).
const mobileNav = nav.filter((n) => n.to !== '/koreksi')

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      aria-label="Ganti tema terang/gelap"
      className="rounded-full p-2 text-xl hover:bg-black/5 dark:hover:bg-white/10"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
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
          <span className="text-xl font-extrabold text-brand">InggrisKu</span>
          <ThemeToggle />
        </div>
        <nav className="flex flex-col gap-1">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} className={navItem}>
              <span>{n.icon}</span> {n.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Header mobile */}
      <header className="flex items-center justify-between border-b border-black/5 p-4 dark:border-white/10 md:hidden">
        <span className="text-lg font-extrabold text-brand">InggrisKu</span>
        <ThemeToggle />
      </header>

      {/* Konten: dibatasi lebar & di tengah untuk keterbacaan */}
      <main className="mx-auto w-full max-w-2xl flex-1 p-4 pb-24 md:p-8 md:pb-8">
        <Outlet />
      </main>

      {/* Bottom nav mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-6 border-t border-black/5 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-slate-800/95 md:hidden">
        {mobileNav.map((n) => (
          <NavLink key={n.to} to={n.to} className={bottomItem}>
            <span className="text-lg">{n.icon}</span>
            <span className="text-[10px]">{n.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

const navItem = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2 font-semibold transition ${
    isActive ? 'bg-brand/10 text-brand' : 'text-slate-600 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/5'
  }`

const bottomItem = ({ isActive }: { isActive: boolean }) =>
  `flex flex-col items-center gap-0.5 py-2 ${isActive ? 'text-brand' : 'text-slate-400'}`
