alter table public.compositions
  add column if not exists style_preset text not null default 'balanced' check (
    style_preset in ('balanced', 'cinematic', 'academic', 'minimalist', 'soulful')
  );
