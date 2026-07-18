import { useState } from 'react'
import { listenOnce, sttSupported } from '../../lib/audio'
import { normalize } from '../../lib/exercises'
import { PixelIcon } from '../PixelIcon'

// Latihan bicara opsional. Sembunyi total bila STT tak didukung (Safari iOS dsb).
export default function SpeakCheck({ target }: { target: string }) {
  if (!sttSupported()) return null
  const [state, setState] = useState<'idle' | 'listening' | 'ok' | 'retry'>('idle')

  async function go() {
    setState('listening')
    try {
      const said = await listenOnce()
      setState(normalize(said) === normalize(target) ? 'ok' : 'retry')
    } catch {
      setState('idle') // izin ditolak / gagal → diamkan
    }
  }

  return (
    <div className="text-sm">
      <button onClick={go} disabled={state === 'listening'} className="font-semibold text-brand">
        <span className="inline-flex items-center gap-2"><PixelIcon name="mic" size={16} /> {state === 'listening' ? 'Mendengarkan…' : 'Coba ucapkan'}</span>
      </button>
      {state === 'ok' && <span className="ml-2 text-success">Bagus, pengucapanmu pas</span>}
      {state === 'retry' && <span className="ml-2 text-accent">Hampir! Coba sekali lagi.</span>}
    </div>
  )
}
