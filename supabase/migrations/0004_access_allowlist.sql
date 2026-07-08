-- Batasi akses: hanya email dalam allowlist yang boleh mendaftar.
-- Walau web di-online-kan, email lain akan ditolak saat signup.

create table if not exists allowed_emails (
  email text primary key
);

-- Isi email yang boleh masuk (tambah/hapus sesukamu).
insert into allowed_emails (email) values
  ('amirul.mi@mhs.usk.ac.id')
  -- , ('teman@example.com')
on conflict do nothing;

-- Trigger signup: tolak email di luar allowlist, lalu buat profil seperti biasa.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from allowed_emails where email = new.email) then
    raise exception 'Email % tidak diizinkan mendaftar.', new.email;
  end if;
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$;

-- allowed_emails tidak boleh dibaca/diubah publik (tak ada policy = tertutup untuk anon/auth).
alter table allowed_emails enable row level security;
