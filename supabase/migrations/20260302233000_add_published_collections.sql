create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  slug text not null unique,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  composition_id uuid not null references public.compositions(id) on delete cascade,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (collection_id, composition_id)
);

create index if not exists idx_collections_user_created
  on public.collections (user_id, created_at desc);

create index if not exists idx_collections_slug
  on public.collections (slug);

create index if not exists idx_collection_items_collection_position
  on public.collection_items (collection_id, position asc);

drop trigger if exists set_collections_updated_at on public.collections;
create trigger set_collections_updated_at
before update on public.collections
for each row execute procedure public.set_updated_at();

alter table public.collections enable row level security;
alter table public.collection_items enable row level security;

drop policy if exists "Collections owned select" on public.collections;
create policy "Collections owned select"
  on public.collections for select
  using (auth.uid() = user_id);

drop policy if exists "Collections owned insert" on public.collections;
create policy "Collections owned insert"
  on public.collections for insert
  with check (auth.uid() = user_id);

drop policy if exists "Collections owned update" on public.collections;
create policy "Collections owned update"
  on public.collections for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Collections owned delete" on public.collections;
create policy "Collections owned delete"
  on public.collections for delete
  using (auth.uid() = user_id);

drop policy if exists "Collection items owned select" on public.collection_items;
create policy "Collection items owned select"
  on public.collection_items for select
  using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "Collection items owned insert" on public.collection_items;
create policy "Collection items owned insert"
  on public.collection_items for insert
  with check (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "Collection items owned update" on public.collection_items;
create policy "Collection items owned update"
  on public.collection_items for update
  using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "Collection items owned delete" on public.collection_items;
create policy "Collection items owned delete"
  on public.collection_items for delete
  using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );
