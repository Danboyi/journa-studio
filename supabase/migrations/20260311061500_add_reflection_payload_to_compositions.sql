alter table public.compositions
add column if not exists reflection jsonb not null default '{}'::jsonb;
