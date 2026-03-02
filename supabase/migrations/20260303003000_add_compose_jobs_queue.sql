create table if not exists public.compose_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'processing', 'completed', 'failed')),
  payload jsonb not null,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 3 check (max_attempts between 1 and 10),
  next_run_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  last_error text,
  composition_id uuid references public.compositions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_compose_jobs_user_created
  on public.compose_jobs (user_id, created_at desc);

create index if not exists idx_compose_jobs_queue_ready
  on public.compose_jobs (status, next_run_at asc, created_at asc);

drop trigger if exists set_compose_jobs_updated_at on public.compose_jobs;
create trigger set_compose_jobs_updated_at
before update on public.compose_jobs
for each row execute procedure public.set_updated_at();

alter table public.compose_jobs enable row level security;

drop policy if exists "Compose jobs owned select" on public.compose_jobs;
create policy "Compose jobs owned select"
  on public.compose_jobs for select
  using (auth.uid() = user_id);

drop policy if exists "Compose jobs owned insert" on public.compose_jobs;
create policy "Compose jobs owned insert"
  on public.compose_jobs for insert
  with check (auth.uid() = user_id);

create or replace function public.claim_compose_jobs(p_limit integer default 5)
returns setof public.compose_jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with candidates as (
    select id
    from public.compose_jobs
    where status = 'queued'
      and next_run_at <= now()
    order by created_at asc
    limit greatest(1, least(coalesce(p_limit, 5), 25))
    for update skip locked
  ),
  updated as (
    update public.compose_jobs j
    set
      status = 'processing',
      started_at = now(),
      attempt_count = j.attempt_count + 1,
      last_error = null
    from candidates c
    where j.id = c.id
    returning j.*
  )
  select * from updated;
end;
$$;

revoke all on function public.claim_compose_jobs(integer) from public, anon, authenticated;
grant execute on function public.claim_compose_jobs(integer) to service_role;
