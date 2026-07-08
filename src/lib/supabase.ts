import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anon) {
  // Pesan jelas saat lupa mengisi .env — bukan error kriptik dari SDK.
  console.warn('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum diisi (lihat .env.example)')
}

export const supabase = createClient(url ?? '', anon ?? '')
