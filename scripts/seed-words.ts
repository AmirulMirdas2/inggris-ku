/**
 * Skrip sekali-pakai: ubah daftar kata polos NGSL menjadi baris `words` lengkap
 * (translation_id, phonetic, chunk, contoh, tense_focus) via Anthropic, lalu upsert.
 *
 * Jalankan (Node 24 bisa langsung .ts):
 *   GEMINI_API_KEY=AIza... \
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   node scripts/seed-words.ts words.txt 6
 *
 * Argumen: [file daftar kata, satu per baris] [theme_week untuk kata baru]
 * Kata yang sudah ada di tabel dilewati (on conflict do nothing).
 */
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const API_KEY = process.env.GEMINI_API_KEY!
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const [, , file = 'words.txt', weekArg = '6'] = process.argv
const week = Number(weekArg)

const words = readFileSync(file, 'utf8').split('\n').map((w) => w.trim()).filter(Boolean)

async function enrich(batch: string[]) {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: 'Kamu penyusun kamus untuk pemula Indonesia. Balas HANYA array JSON valid.' }],
      },
      contents: [
        {
          role: 'user',
          parts: [{
            text:
              `Untuk tiap kata Inggris berikut, buat objek JSON dengan field: ` +
              `text, translation_id (arti singkat Indonesia), phonetic (IPA), part_of_speech, ` +
              `chunk (frasa umum 2-3 kata), example_en (kalimat pemula), example_id (terjemahan), ` +
              `tense_focus (salah satu: none, presentSimple, presentContinuous, pastSimple, future, mixed). ` +
              `Kata: ${JSON.stringify(batch)}`,
          }],
        },
      ],
      generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
    }),
  })
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const text: string = data.candidates[0].content.parts[0].text
  const json = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
  return JSON.parse(json) as Record<string, unknown>[]
}

for (let i = 0; i < words.length; i += 20) {
  const batch = words.slice(i, i + 20)
  console.log(`Batch ${i / 20 + 1}: ${batch.length} kata…`)
  const rows = (await enrich(batch)).map((r, j) => ({ ...r, theme_week: week, frequency_rank: i + j + 1 }))
  const { error } = await supabase.from('words').upsert(rows, { onConflict: 'text', ignoreDuplicates: true })
  if (error) throw error
}
console.log('Selesai.')
