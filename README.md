# InggrisKu

Aplikasi web (PWA) belajar bahasa Inggris dari nol — metode SRS + produksi kalimat dinilai LLM. Semua antarmuka Bahasa Indonesia.

Stack: React + Vite + TS · Tailwind · Zustand · React Router · Supabase (Auth/Postgres/RLS/Edge Functions/pg_cron) · Anthropic (Haiku) · Resend.

## Jalankan lokal

```bash
npm install
npm rebuild esbuild      # lingkungan ini melewati postinstall; wajib sekali setelah install
cp .env.example .env     # lalu isi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY
npm run dev
```

`npm test` menjalankan unit test SRS + latihan. `npm run build` build produksi.

## Setup Supabase (Fase 2–3, 7, 10)

1. Buat project di https://supabase.com. Dari **Settings → API** ambil:
   - Project URL → `VITE_SUPABASE_URL`
   - `anon` public key → `VITE_SUPABASE_ANON_KEY` (aman untuk frontend)
   - `service_role` key → HANYA untuk cron & skrip seed (jangan di frontend)
2. **SQL Editor** → jalankan berurutan:
   - `supabase/migrations/0001_init.sql` (tabel, enum, RLS, trigger profil)
   - `supabase/migrations/0002_seed_words.sql` (±60 kata minggu 1–5)
3. **Authentication → Providers**: aktifkan Email. Untuk uji cepat, matikan "Confirm email" agar signup langsung login.
4. Isi `.env`, lalu `npm run dev`. Daftar → belajar → review sudah jalan.

## Edge Function: penilaian kalimat (Fase 7)

Pakai Google Gemini (`gemini-2.0-flash`). Ambil key gratis di https://aistudio.google.com/apikey

```bash
supabase link --project-ref <PROJECT_REF>
supabase secrets set GEMINI_API_KEY=AIza...
supabase functions deploy evaluate-sentence
```

Kunci Gemini hanya jadi Supabase secret — tidak pernah di repo/frontend.
(Ganti provider = ubah hanya `supabase/functions/evaluate-sentence/index.ts`.)

## Email pengingat harian (Fase 10)

1. Akun https://resend.com → API key. Verifikasi domain, atau pakai `onboarding@resend.dev` untuk uji (hanya bisa kirim ke email akun Resend-mu).
2. Set secret & deploy:
   ```bash
   supabase secrets set RESEND_API_KEY=re_... RESEND_FROM="InggrisKu <no-reply@domainmu>" APP_URL=https://appmu
   supabase functions deploy send-reminders
   ```
3. Jadwalkan cron: buka `supabase/migrations/0003_cron.sql`, ganti `<PROJECT_REF>` & `<SERVICE_ROLE_KEY>`, jalankan di SQL Editor.

Email terkirim hanya bila ada kata jatuh tempo, maksimal sekali/hari/pengguna, menghormati jam & timezone (diatur di Settings).

## Menambah kata (opsional)

`supabase/migrations/0002_seed_words.sql` sudah cukup untuk mulai. Untuk memperluas dari daftar NGSL polos:

```bash
GEMINI_API_KEY=AIza... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  node scripts/seed-words.ts words.txt 6      # words.txt = satu kata per baris, minggu 6
```
