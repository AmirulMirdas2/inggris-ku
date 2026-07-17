// Blok skeleton berkilau. Pakai untuk mengganti teks "Memuat…".
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />
}

// Beberapa baris kartu skeleton — loader generik untuk daftar/halaman.
export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Memuat">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-card" />
      ))}
    </div>
  )
}
