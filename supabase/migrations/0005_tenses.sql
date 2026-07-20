-- InggrisKu — modul belajar 16 tense. Progress unlock + state SRS per pengguna.
-- Jalankan di Supabase SQL Editor atau `supabase db push`.

-- Satu tabel memegang progress belajar (correct_count, understood) SEKALIGUS
-- state SRS (aktif setelah 'mastered'). Tidak perlu tabel kedua.
create table tense_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  tense_key text not null,
  correct_count int not null default 0,        -- kalimat benar; 10 buka tense berikut, 50 mastered
  understood boolean not null default false,    -- lulus tahap "Kenali"
  -- SRS aktif setelah mastered
  ease_factor real not null default 2.5,
  interval_days int not null default 0,
  repetitions int not null default 0,
  due_date date,                                -- null = belum masuk SRS
  last_reviewed timestamptz,
  status text not null default 'learning',      -- learning | mastered
  primary key (user_id, tense_key)
);
create index tense_progress_due_idx on tense_progress (user_id, due_date, status);

alter table tense_progress enable row level security;
create policy "tense_progress - all" on tense_progress for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
