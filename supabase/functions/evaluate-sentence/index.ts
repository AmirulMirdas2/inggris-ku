// Edge Function: proxy penilaian kalimat ke Google Gemini.
// Key GEMINI_API_KEY hanya sebagai Supabase secret — tidak pernah di frontend.
// Deploy: supabase functions deploy evaluate-sentence
// Set secret: supabase secrets set GEMINI_API_KEY=AIza...
// Dapat key gratis: https://aistudio.google.com/apikey

// alias '-latest' → auto ke versi lite terbaru, hindari model retired (2.0-flash free tier = 0).
const MODEL = 'gemini-flash-lite-latest'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const FALLBACK = {
  benar: false, pakaiKataTarget: false, tenseDetected: 'unknown',
  sesuaiTenseTarget: false, kalimatKoreksi: '', artiKalimatId: '',
  penjelasanId: 'Maaf, penilaian sedang bermasalah. Coba lagi sebentar ya. 🙂',
  koreksiList: [], bonusTense: false,
}

// Aspek koreksi tetap — frontend memakainya sebagai kunci stabil untuk mencocokkan
// koreksi antar-percobaan (yang sudah diperbaiki dicoret, yang baru ditambah).
const ASPEK = 'tense | kata-kerja | subjek | kata-target | artikel | preposisi | urutan | kapital | tanda-baca | ejaan | lainnya'

const SYSTEM =
  'Kamu guru bahasa Inggris untuk pemula Indonesia. Nilai kalimat siswa. ' +
  'Balas HANYA JSON valid tanpa teks lain. Bahasa penjelasan = Indonesia. Nada ramah. ' +
  'PERIKSA kalimat kata demi kata dan daftarkan SETIAP kesalahan yang ada di koreksiList — ' +
  'JANGAN berhenti di satu kesalahan. Cek semua: huruf kapital di awal kalimat & kata "I", ' +
  'kata kerja yang hilang/salah (mis. butuh "is" sebelum kata sifat), kesesuaian subjek-kata kerja ' +
  '(he/she/it + s/es), pilihan preposisi (in/on/at), artikel (a/an/the), urutan kata, ejaan, dan tanda baca. ' +
  'Satu item = satu aspek berbeda + satu kalimat ringkas cara memperbaiki (maksimal 6 item). ' +
  'PENTING: taruh SEMUA kesalahan di koreksiList, JANGAN gabung jadi satu di tenseDetected/penjelasanId. ' +
  'tenseDetected = tense dari kalimat yang SUDAH dibetulkan (bukan "missing verb" dsb). ' +
  'Jika kalimat sudah benar, koreksiList = []. Selalu sebut satu hal yang sudah benar di penjelasanId.'

// Few-shot: model lite butuh contoh konkret agar mau memecah kesalahan ke koreksiList
// (bukan menumpuknya di tenseDetected). Satu kalimat rusak → banyak kartu.
const EXAMPLE =
  '\n\nContoh. Kalimat siswa: "he careful in the tree". Jawaban yang BENAR ' +
  '(perhatikan koreksiList berisi BANYAK item, satu per kesalahan):\n' +
  '{"benar":false,"pakaiKataTarget":true,"tenseDetected":"Present Simple",' +
  '"sesuaiTenseTarget":true,"kalimatKoreksi":"He is careful on the tree.",' +
  '"artiKalimatId":"Dia hati-hati di atas pohon.",' +
  '"penjelasanId":"Pilihan katamu sudah bagus! Ada beberapa hal kecil yang perlu dirapikan ya.",' +
  '"koreksiList":[' +
  '{"aspek":"kapital","pesan":"Awali kalimat dengan huruf besar: \\"He\\", bukan \\"he\\"."},' +
  '{"aspek":"kata-kerja","pesan":"Butuh \\"is\\" sebelum kata sifat: \\"He is careful\\"."},' +
  '{"aspek":"preposisi","pesan":"Pakai \\"on the tree\\" (di atas pohon), bukan \\"in the tree\\"."}' +
  '],"bonusTense":false}'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { word, tenseFocus, sentence } = await req.json()
    if (!word || !sentence) return json({ error: 'word & sentence wajib' }, 400)

    const prompt =
      `Kata target: "${word}". Tense yang diharapkan: "${tenseFocus}".\n` +
      `Kalimat siswa: "${sentence}".\n\n` +
      `Format:\n{\n  "benar": true|false,\n  "pakaiKataTarget": true|false,\n` +
      `  "tenseDetected": "string",\n  "sesuaiTenseTarget": true|false,\n` +
      `  "kalimatKoreksi": "string (kosong jika sudah benar)",\n` +
      `  "artiKalimatId": "arti Bahasa Indonesia dari kalimat yang BENAR (kalimat siswa bila sudah benar, atau kalimatKoreksi bila dikoreksi)",\n` +
      `  "penjelasanId": "1-2 kalimat Bahasa Indonesia, ramah, ringkasan + satu pujian",\n` +
      `  "koreksiList": [ { "aspek": "${ASPEK}", "pesan": "1 kalimat ramah cara memperbaiki aspek ini" } ],\n` +
      `  "bonusTense": true|false\n}` +
      EXAMPLE

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent` +
      `?key=${Deno.env.get('GEMINI_API_KEY')}`

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        // responseMimeType JSON → Gemini balas JSON valid, tanpa pagar ```.
        generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
      }),
    })

    if (!res.ok) {
      console.error('Gemini error', res.status, await res.text())
      return json(FALLBACK, 200)
    }

    const data = await res.json()
    const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    let parsed
    try {
      parsed = JSON.parse(clean)
    } catch {
      console.error('Parse gagal:', text)
      return json(FALLBACK, 200)
    }
    return json(parsed, 200)
  } catch (e) {
    console.error(e)
    return json(FALLBACK, 200)
  }
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'content-type': 'application/json' },
  })
}
