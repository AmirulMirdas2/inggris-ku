// Edge Function: proxy penilaian kalimat ke Google Gemini.
// Key GEMINI_API_KEY hanya sebagai Supabase secret — tidak pernah di frontend.
// Deploy: supabase functions deploy evaluate-sentence
// Set secret: supabase secrets set GEMINI_API_KEY=AIza...
// Dapat key gratis: https://aistudio.google.com/apikey

const MODEL = 'gemini-2.0-flash'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const FALLBACK = {
  benar: false, pakaiKataTarget: false, tenseDetected: 'unknown',
  sesuaiTenseTarget: false, kalimatKoreksi: '',
  penjelasanId: 'Maaf, penilaian sedang bermasalah. Coba lagi sebentar ya. 🙂',
  bonusTense: false,
}

const SYSTEM =
  'Kamu guru bahasa Inggris untuk pemula Indonesia. Nilai kalimat siswa. ' +
  'Balas HANYA JSON valid tanpa teks lain. Bahasa penjelasan = Indonesia. ' +
  'Nada ramah dan menyemangati. Beri MAKSIMAL SATU koreksi utama. ' +
  'Selalu sebut satu hal yang sudah benar.'

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
      `  "penjelasanId": "1-2 kalimat Bahasa Indonesia, ramah, satu koreksi + satu pujian",\n` +
      `  "bonusTense": true|false\n}`

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
