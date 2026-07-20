// Edge Function: isi kosakata Minggu 6+ dengan AI, lalu CACHE ke tabel `words`.
// Dipanggil fetchNewWords() saat sebuah minggu belum punya kata. Sekali generate
// → tersimpan permanen, dipakai semua pengguna (bukan per-panggilan berbayar).
//
// Deploy: supabase functions deploy generate-words
// Secret: GEMINI_API_KEY (sudah dipakai evaluate-sentence). SUPABASE_* otomatis.
//
// ponytail: no lock — dua pengguna membuka minggu yang sama berbarengan bisa
// double-generate; upsert on-conflict-ignore menyerap duplikat. Tambah advisory
// lock kalau throughput jadi masalah.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const MODEL = 'gemini-flash-lite-latest'
const COUNT = 12 // kata baru per minggu

// Service-role: tabel words read-only bagi pengguna biasa (RLS), jadi insert
// harus lewat kunci ini yang menembus RLS.
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { week } = await req.json()
    const wk = Number(week)
    if (!wk || wk < 6) return json({ error: 'week >= 6 wajib' }, 400)

    // Idempoten: kalau minggu ini sudah terisi (mis. pengguna lain baru saja
    // generate), jangan panggil AI lagi.
    const { count } = await supabase.from('words')
      .select('id', { count: 'exact', head: true }).eq('theme_week', wk)
    if (count && count > 0) return json({ inserted: 0, cached: true }, 200)

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent` +
      `?key=${Deno.env.get('GEMINI_API_KEY')}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: 'Kamu penyusun kamus untuk pemula Indonesia. Balas HANYA array JSON valid tanpa teks lain.' }],
        },
        contents: [{
          role: 'user',
          parts: [{
            text:
              `Buat ${COUNT} kata bahasa Inggris tingkat pemula-menengah yang berguna sehari-hari ` +
              `untuk pelajar Indonesia minggu ke-${wk}. Hindari kata paling dasar (I, you, eat, go, the). ` +
              `Variasikan jenis kata. Tiap kata jadi objek JSON dengan field: ` +
              `text (kata Inggris, huruf kecil), translation_id (arti singkat Indonesia), ` +
              `phonetic (IPA), part_of_speech, chunk (frasa umum 2-3 kata), ` +
              `example_en (kalimat pemula), example_id (terjemahan Indonesia), ` +
              `tense_focus (salah satu persis: none, presentSimple, presentContinuous, pastSimple, future, mixed).`,
          }],
        }],
        generationConfig: { temperature: 0.4, responseMimeType: 'application/json' },
      }),
    })
    if (!res.ok) {
      console.error('Gemini error', res.status, await res.text())
      return json({ error: 'AI gagal' }, 502)
    }

    const data = await res.json()
    const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]'
    const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    let list: Record<string, unknown>[]
    try {
      list = JSON.parse(clean)
    } catch {
      console.error('Parse gagal:', text)
      return json({ error: 'AI balas non-JSON' }, 502)
    }
    if (!Array.isArray(list) || list.length === 0) return json({ error: 'AI balas kosong' }, 502)

    const rows = list
      .filter((r) => typeof r.text === 'string' && typeof r.translation_id === 'string')
      .map((r, i) => ({ ...r, theme_week: wk, frequency_rank: 1000 + i }))
    const { error, count: inserted } = await supabase.from('words')
      .upsert(rows, { onConflict: 'text', ignoreDuplicates: true, count: 'exact' })
    if (error) {
      console.error('Upsert error', error)
      return json({ error: 'Simpan gagal' }, 500)
    }
    return json({ inserted: inserted ?? rows.length }, 200)
  } catch (e) {
    console.error(e)
    return json({ error: 'kesalahan tak terduga' }, 500)
  }
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'content-type': 'application/json' },
  })
}
