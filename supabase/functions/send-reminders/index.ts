// Edge Function: pengingat email harian. Dijalankan cron TIAP JAM (lihat 0003_cron.sql).
// Kirim HANYA bila: reminder_enabled, jam lokal == reminder_time, belum dikirim hari ini,
// dan ada >0 kata jatuh tempo. Maksimal sekali per hari per pengguna.
// Secrets: RESEND_API_KEY, RESEND_FROM, APP_URL. SUPABASE_* otomatis tersedia.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)
const RESEND_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM = Deno.env.get('RESEND_FROM') ?? 'InggrisKu <onboarding@resend.dev>'
const APP_URL = Deno.env.get('APP_URL') ?? 'https://inggrisku.app'

/** Jam & tanggal lokal pengguna. */
function localNow(tz: string): { hour: number; date: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, hour: '2-digit', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const get = (t: string) => parts.find((p) => p.type === t)!.value
  return { hour: Number(get('hour')) % 24, date: `${get('year')}-${get('month')}-${get('day')}` }
}

Deno.serve(async () => {
  const { data: profiles, error } = await supabase
    .from('profiles').select('id, email, timezone, reminder_time, last_reminder_date')
    .eq('reminder_enabled', true)
  if (error) return new Response(error.message, { status: 500 })

  let sent = 0
  for (const p of profiles ?? []) {
    const { hour, date } = localNow(p.timezone)
    const targetHour = Number(String(p.reminder_time).slice(0, 2))
    if (hour !== targetHour) continue          // belum jamnya
    if (p.last_reminder_date === date) continue // sudah dikirim hari ini

    const { count } = await supabase.from('review_cards')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', p.id).lte('due_date', date).neq('status', 'mastered')
    if (!count || count === 0) continue         // tidak ada yang due → jangan kirim

    await sendEmail(p.email, count)
    await supabase.from('profiles').update({ last_reminder_date: date }).eq('id', p.id)
    sent++
  }
  return new Response(JSON.stringify({ sent }), { headers: { 'content-type': 'application/json' } })
})

async function sendEmail(to: string, n: number) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${RESEND_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: FROM,
      to,
      subject: `Ada ${n} kata untuk diulang hari ini`,
      html:
        `<div style="font-family:sans-serif;max-width:480px;margin:auto;color:#333">` +
        `<h2 style="color:#1D9E75">Halo! 🌱</h2>` +
        `<p>Ada <b>${n} kata</b> yang jatuh tempo untuk diulang hari ini. ` +
        `Cukup beberapa menit untuk menjaga ingatanmu tetap kuat.</p>` +
        `<p><a href="${APP_URL}/review" style="display:inline-block;background:#1D9E75;color:#fff;` +
        `padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:bold">Buka aplikasi</a></p>` +
        `<p style="color:#999;font-size:13px">Sedikit tiap hari &gt; banyak sesekali. Semangat! 💪</p></div>`,
    }),
  })
  if (!res.ok) console.error('Resend error', res.status, await res.text())
}
