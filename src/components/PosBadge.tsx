import { posId } from '../lib/pos'

// Chip kecil kelas kata (kata benda / kerja / sifat …). Null-pos → tak render.
export function PosBadge({ pos, className = '' }: { pos: string | null | undefined; className?: string }) {
  const label = posId(pos)
  if (!label) return null
  return (
    <span className={`inline-block border-2 border-ink bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink dark:border-white/25 dark:text-slate-100 ${className}`}>
      {label}
    </span>
  )
}
