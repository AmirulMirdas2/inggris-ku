-- InggrisKu — skema awal. Jalankan di Supabase SQL Editor (atau `supabase db push`).
-- Semua tabel per-pengguna memakai RLS: user_id = auth.uid().

-- ---------- Enums ----------
create type tense_focus as enum (
  'none', 'presentSimple', 'presentContinuous', 'pastSimple', 'future', 'mixed'
);
create type card_status as enum ('learning', 'mastered');

-- ---------- profiles (1 baris per pengguna) ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  timezone text not null default 'Asia/Jakarta',
  reminder_enabled boolean not null default true,
  reminder_time time not null default '07:00',
  last_reminder_date date,
  current_week int not null default 1,
  daily_goal int not null default 10,
  xp int not null default 0,
  streak_days int not null default 0,
  last_active_date date,
  words_mastered int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- words (bank kata global; read-only bagi pengguna) ----------
create table words (
  id bigint generated always as identity primary key,
  text text not null unique,
  translation_id text not null,
  phonetic text,
  part_of_speech text,
  chunk text,
  example_en text,
  example_id text,
  theme_week int not null default 1,
  frequency_rank int,
  tense_focus tense_focus not null default 'none'
);
create index words_theme_week_idx on words (theme_week, frequency_rank);

-- ---------- review_cards (state SRS per kata per pengguna) ----------
create table review_cards (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id bigint not null references words(id) on delete cascade,
  ease_factor real not null default 2.5,
  interval_days int not null default 0,
  repetitions int not null default 0,
  due_date date not null default current_date,
  last_reviewed timestamptz,
  status card_status not null default 'learning',
  unique (user_id, word_id)
);
create index review_cards_due_idx on review_cards (user_id, due_date, status);

-- ---------- sentence_attempts ----------
create table sentence_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id bigint not null references words(id) on delete cascade,
  sentence_text text not null,
  is_correct boolean not null,
  corrected_text text,
  explanation_id text,
  tense_detected text,
  bonus_earned boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- error_entries (deck koreksi) ----------
create table error_entries (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id bigint not null references words(id) on delete cascade,
  wrong_sentence text not null,
  correction text,
  explanation_id text,
  resolved boolean not null default false,
  next_review date not null default current_date,
  created_at timestamptz not null default now()
);
create index error_entries_user_idx on error_entries (user_id, resolved, next_review);

-- ---------- RLS ----------
alter table profiles enable row level security;
alter table words enable row level security;
alter table review_cards enable row level security;
alter table sentence_attempts enable row level security;
alter table error_entries enable row level security;

-- profiles: pengguna hanya barisnya sendiri
create policy "own profile - select" on profiles for select using (auth.uid() = id);
create policy "own profile - update" on profiles for update using (auth.uid() = id);
create policy "own profile - insert" on profiles for insert with check (auth.uid() = id);

-- words: semua user terautentikasi boleh baca, tidak boleh ubah
create policy "words - read" on words for select to authenticated using (true);

-- Tabel per-pengguna: pola seragam user_id = auth.uid()
create policy "cards - all" on review_cards for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "attempts - all" on sentence_attempts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "errors - all" on error_entries for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- Auto-buat profiles saat signup ----------
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
