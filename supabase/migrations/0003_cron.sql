-- Jadwalkan send-reminders tiap jam. Fungsi sendiri yang memutuskan siapa
-- yang benar-benar dikirimi (cek jam lokal + last_reminder_date).
-- Ganti <PROJECT_REF> dan <SERVICE_ROLE_KEY> sebelum menjalankan.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'send-reminders-hourly',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Batalkan dengan: select cron.unschedule('send-reminders-hourly');
