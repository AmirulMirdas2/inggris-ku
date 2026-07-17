import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="animate-fade-up mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="text-6xl">🌱</div>
      <h1 className="text-4xl font-extrabold tracking-tight text-brand">InggrisKu</h1>
      <p className="text-lg text-slate-600 dark:text-slate-300">
        Belajar bahasa Inggris dari nol total. Pelan tapi nempel — pakai
        pengulangan berjarak dan latihan bikin kalimat sendiri.
      </p>
      <div className="w-full space-y-3">
        {/* Auth asli dipasang di Fase 3; sementara arahkan ke dashboard. */}
        <Link to="/dashboard" className="btn-primary block text-center">Mulai belajar</Link>
        <Link to="/dashboard" className="btn-ghost block text-center">Masuk</Link>
      </div>
      <p className="text-sm text-slate-400">Gratis · Bisa dipasang seperti aplikasi</p>
    </div>
  )
}
