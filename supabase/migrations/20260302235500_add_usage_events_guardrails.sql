create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  units integer not null check (units >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_usage_events_user_endpoint_created
  on public.usage_events (user_id, endpoint, created_at desc);

alter table public.usage_events enable row level security;

drop policy if exists "Usage events owned select" on public.usage_events;
create policy "Usage events owned select"
  on public.usage_events for select
  using (auth.uid() = user_id);

drop policy if exists "Usage events owned insert" on public.usage_events;
create policy "Usage events owned insert"
  on public.usage_events for insert
  with check (auth.uid() = user_id);
