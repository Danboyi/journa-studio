create table if not exists public.composition_shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  composition_id uuid not null references public.compositions(id) on delete cascade,
  token uuid not null default gen_random_uuid(),
  expires_at timestamptz,
  is_revoked boolean not null default false,
  created_at timestamptz not null default now(),
  unique (token)
);

create index if not exists idx_composition_shares_user_created
  on public.composition_shares (user_id, created_at desc);

create index if not exists idx_composition_shares_composition
  on public.composition_shares (composition_id);

alter table public.composition_shares enable row level security;

drop policy if exists "Composition shares owned select" on public.composition_shares;
create policy "Composition shares owned select"
  on public.composition_shares for select
  using (auth.uid() = user_id);

drop policy if exists "Composition shares owned insert" on public.composition_shares;
create policy "Composition shares owned insert"
  on public.composition_shares for insert
  with check (auth.uid() = user_id);

drop policy if exists "Composition shares owned update" on public.composition_shares;
create policy "Composition shares owned update"
  on public.composition_shares for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Composition shares owned delete" on public.composition_shares;
create policy "Composition shares owned delete"
  on public.composition_shares for delete
  using (auth.uid() = user_id);
