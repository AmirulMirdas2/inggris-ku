import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { PixelIcon } from '../components/PixelIcon'

// Terjemahkan error Supabase yang umum ke Bahasa Indonesia.
function translateError(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return 'Email atau password salah.'
  if (/already registered|already been registered/i.test(msg)) return 'Email ini sudah terdaftar.'
  if (/password should be at least/i.test(msg)) return 'Password minimal 6 karakter.'
  if (/rate limit|too many/i.test(msg)) return 'Terlalu banyak percobaan. Coba lagi nanti.'
  // Trigger allowlist menolak → GoTrue membungkusnya jadi "Database error saving new user".
  if (/database error saving new user|tidak diizinkan/i.test(msg)) return 'Email ini belum diizinkan mengakses aplikasi.'
  return 'Terjadi kesalahan. Coba lagi ya.'
}

function Shell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="animate-fade-up mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-6">
      <div className="text-center">
        <PixelIcon name="sprout" size={48} className="animate-bob" />
        <h1 className="mt-2 text-2xl font-extrabold text-brand">{title}</h1>
        <p className="muted">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

function CredentialForm({ mode }: { mode: 'masuk' | 'daftar' }) {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError(''); setNotice('')
    try {
      if (mode === 'daftar') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        // Jika konfirmasi email dimatikan, sesi langsung aktif → ke dashboard.
        const { data } = await supabase.auth.getSession()
        if (data.session) nav('/dashboard')
        else setNotice('Cek emailmu untuk konfirmasi, lalu masuk ya.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        nav('/dashboard')
      }
    } catch (err) {
      setError(translateError((err as Error).message))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <input
        type="email" required autoComplete="email" placeholder="Email"
        value={email} onChange={(e) => setEmail(e.target.value)}
        className="input !text-base"
      />
      <input
        type="password" required autoComplete={mode === 'daftar' ? 'new-password' : 'current-password'}
        placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
        className="input !text-base"
      />
      {error && <p className="text-sm font-semibold text-coral">{error}</p>}
      {notice && <p className="text-sm font-semibold text-success">{notice}</p>}
      <button type="submit" disabled={busy} className="btn-primary">
        {busy ? 'Sebentar…' : mode === 'daftar' ? 'Daftar' : 'Masuk'}
      </button>
    </form>
  )
}

export function Masuk() {
  return (
    <Shell title="Masuk" subtitle="Lanjut belajarmu">
      <CredentialForm mode="masuk" />
      <div className="text-center text-sm muted">
        <Link to="/lupa-password" className="font-semibold text-brand">Lupa password?</Link>
        <span className="mx-2">·</span>
        Belum punya akun? <Link to="/daftar" className="font-semibold text-brand">Daftar</Link>
      </div>
    </Shell>
  )
}

export function Daftar() {
  return (
    <Shell title="Daftar" subtitle="Mulai dari nol, pelan tapi nempel">
      <CredentialForm mode="daftar" />
      <p className="text-center text-sm muted">
        Sudah punya akun? <Link to="/masuk" className="font-semibold text-brand">Masuk</Link>
      </p>
    </Shell>
  )
}

export function LupaPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/masuk`,
    })
    setBusy(false); setSent(true) // Selalu tampilkan sukses (jangan bocorkan email terdaftar).
  }

  return (
    <Shell title="Lupa Password" subtitle="Kami kirim tautan reset ke emailmu">
      {sent ? (
        <div className="card text-center">
          <p className="flex items-center gap-2 font-semibold text-success"><PixelIcon name="mail" size={16} /> Kalau emailmu terdaftar, tautan reset sudah dikirim.</p>
          <Link to="/masuk" className="btn-ghost mt-4 block text-center">Kembali ke Masuk</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="card space-y-4">
          <input
            type="email" required placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input !text-base"
          />
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? 'Mengirim…' : 'Kirim tautan reset'}
          </button>
          <Link to="/masuk" className="block text-center text-sm font-semibold text-brand">Kembali</Link>
        </form>
      )}
    </Shell>
  )
}
