import { Navigate } from 'react-router-dom'
import { useAuth } from '../store/auth'

// Belum login → arahkan ke Masuk. Masih memuat sesi → tampilkan placeholder.
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-slate-400">
        Memuat…
      </div>
    )
  }
  if (!session) return <Navigate to="/masuk" replace />
  return <>{children}</>
}
