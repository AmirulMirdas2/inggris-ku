import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../store/auth'
import type { Profile } from '../lib/types'
import { getTtsRate, setTtsRate, speak } from '../lib/audio'
import { sfxEnabled, setSfxEnabled, sfxCorrect } from '../lib/sfx'
import { musicEnabled, setMusicEnabled } from '../lib/music'
import { PixelIcon } from '../components/PixelIcon'

const TIMEZONES = ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura']

export default function Settings() {
  const { profile, setProfile, signOut } = useAuth()
  const nav = useNavigate()
  const [rate, setRate] = useState(getTtsRate())
  const [sfx, setSfx] = useState(sfxEnabled())
  const [music, setMusic] = useState(musicEnabled())
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
        <p className="text-xs muted">
          Email dikirim hanya bila ada kata yang jatuh tempo, maksimal sekali sehari.
        </p>
      </section>

      <section className="card space-y-4">
        <h2 className="font-bold">Audio</h2>
        <Row label="Efek suara 8-bit">
          <Toggle checked={sfx} onChange={(v) => { setSfx(v); setSfxEnabled(v); if (v) sfxCorrect() }} />
        </Row>
        <Row label="Musik latar retro">
          <Toggle checked={music} onChange={(v) => { setMusic(v); setMusicEnabled(v) }} />
        </Row>
        <p className="text-xs muted">Musik otomatis berhenti selama sesi latihan.</p>
        <Row label="Kecepatan suara">
          <input
            type="range" min={0.5} max={1.2} step={0.1} value={rate}
            onChange={(e) => { const r = Number(e.target.value); setRate(r); setTtsRate(r) }}
            className="accent-brand"
          />
        </Row>
        <button onClick={() => speak('Hello, how are you today?', rate)} className="btn-ghost">
          <span className="inline-flex items-center gap-2"><PixelIcon name="speaker" size={16} /> Coba suara</span>
        </button>
      </section>

      <button onClick={() => { signOut(); nav('/masuk') }} className="btn-ghost text-coral">
        Keluar
      </button>
      {saving && <p className="text-center text-xs muted">menyimpan…</p>}
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
      className={`h-8 w-14 border-[3px] border-ink p-0.5 transition-colors duration-75 ease-soft dark:border-white/25 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent ${checked ? 'bg-brand' : 'bg-black/15 dark:bg-white/20'}`}
      aria-pressed={checked}
    >
      {/* Knop geser per-langkah, seperti saklar sprite */}
      <span className={`block h-full w-5 border-[2px] border-ink bg-white transition-transform duration-100 ease-soft ${checked ? 'translate-x-[26px]' : 'translate-x-0'}`} />
    </button>
  )
}
