alter table public.composition_shares
  add column if not exists password_hash text,
  add column if not exists view_count integer not null default 0,
  add column if not exists last_viewed_at timestamptz;
