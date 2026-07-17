import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../store/auth'
import type { Profile } from '../lib/types'
import { getTtsRate, setTtsRate, speak } from '../lib/audio'

const TIMEZONES = ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura']

export default function Settings() {
  const { profile, setProfile, signOut } = useAuth()
  const nav = useNavigate()
  const [rate, setRate] = useState(getTtsRate())
  const [saving, setSaving] = useState(false)

  if (!profile) return null

  async function patch(fields: Partial<Profile>) {
    setSaving(true)
    const next = { ...profile!, ...fields }
    setProfile(next) // optimistis
    await supabase.from('profiles').update(fields).eq('id', profile!.id)
    setSaving(false)
  }

  return (
    <div className="animate-fade-up space-y-6">
      <h1 className="text-2xl font-extrabold">Pengaturan</h1>

      <section className="card space-y-4">
        <h2 className="font-bold">Pengingat email harian</h2>
        <Row label="Nyalakan pengingat">
          <Toggle checked={profile.reminder_enabled} onChange={(v) => patch({ reminder_enabled: v })} />
        </Row>
        <Row label="Jam pengingat">
          <input
            type="time" value={profile.reminder_time.slice(0, 5)}
            onChange={(e) => patch({ reminder_time: e.target.value })}
            className="input-sm"
          />
        </Row>
        <Row label="Zona waktu">
          <select
            value={profile.timezone} onChange={(e) => patch({ timezone: e.target.value })}
            className="input-sm"
          >
            {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </Row>
        <p className="text-xs text-slate-400">
          Email dikirim hanya bila ada kata yang jatuh tempo, maksimal sekali sehari.
        </p>
      </section>

      <section className="card space-y-4">
        <h2 className="font-bold">Audio</h2>
        <Row label="Kecepatan suara">
          <input
            type="range" min={0.5} max={1.2} step={0.1} value={rate}
            onChange={(e) => { const r = Number(e.target.value); setRate(r); setTtsRate(r) }}
            className="accent-brand"
          />
        </Row>
        <button onClick={() => speak('Hello, how are you today?', rate)} className="btn-ghost">
          🔊 Coba suara
        </button>
      </section>

      <button onClick={() => { signOut(); nav('/masuk') }} className="btn-ghost text-coral">
        Keluar
      </button>
      {saving && <p className="text-center text-xs text-slate-400">menyimpan…</p>}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`h-7 w-12 rounded-full transition duration-200 ease-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream dark:focus-visible:ring-offset-slate-900 ${checked ? 'bg-brand' : 'bg-black/15 dark:bg-white/20'}`}
      aria-pressed={checked}
    >
      <span className={`block h-6 w-6 rounded-full bg-white shadow-sm transition duration-200 ease-soft ${checked ? 'translate-x-6' : 'translate-x-0.5'}`} />
    </button>
  )
}
