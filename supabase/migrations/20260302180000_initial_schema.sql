-- My Journa initial schema
-- Apply with Supabase SQL editor or migration runner.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  headline text not null,
  body text not null,
  mood text not null check (
    mood in ('funny', 'serious', 'sad', 'sorrowful', 'horror', 'suspense', 'soul-piercing')
  ),
  refined_body text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.compositions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (
    mode in (
      'daily-journal',
      'story',
      'essay',
      'statement-of-purpose',
      'biography',
      'autobiography',
      'life-documentation'
    )
  ),
  mood text not null check (
    mood in ('funny', 'serious', 'sad', 'sorrowful', 'horror', 'suspense', 'soul-piercing')
  ),
  source_text text not null,
  voice_notes text not null,
  title text not null,
  excerpt text not null,
  draft text not null,
  editorial_notes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_journal_entries_user_created
  on public.journal_entries (user_id, created_at desc);

create index if not exists idx_compositions_user_created
  on public.compositions (user_id, created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists set_journal_entries_updated_at on public.journal_entries;
create trigger set_journal_entries_updated_at
before update on public.journal_entries
for each row execute procedure public.set_updated_at();

drop trigger if exists set_compositions_updated_at on public.compositions;
create trigger set_compositions_updated_at
before update on public.compositions
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.journal_entries enable row level security;
alter table public.compositions enable row level security;

drop policy if exists "Profiles are readable by owner" on public.profiles;
create policy "Profiles are readable by owner"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Journal entries owned select" on public.journal_entries;
create policy "Journal entries owned select"
  on public.journal_entries for select
  using (auth.uid() = user_id);

drop policy if exists "Journal entries owned insert" on public.journal_entries;
create policy "Journal entries owned insert"
  on public.journal_entries for insert
  with check (auth.uid() = user_id);

drop policy if exists "Journal entries owned update" on public.journal_entries;
create policy "Journal entries owned update"
  on public.journal_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Journal entries owned delete" on public.journal_entries;
create policy "Journal entries owned delete"
  on public.journal_entries for delete
  using (auth.uid() = user_id);

drop policy if exists "Compositions owned select" on public.compositions;
create policy "Compositions owned select"
  on public.compositions for select
  using (auth.uid() = user_id);

drop policy if exists "Compositions owned insert" on public.compositions;
create policy "Compositions owned insert"
  on public.compositions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Compositions owned update" on public.compositions;
create policy "Compositions owned update"
  on public.compositions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Compositions owned delete" on public.compositions;
create policy "Compositions owned delete"
  on public.compositions for delete
  using (auth.uid() = user_id);
