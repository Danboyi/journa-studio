-- Phase 1: Quick capture (entry types, optional headline)
-- Phase 2: Streak system (profile-level streak tracking)

-- Allow entries without a headline (quick capture)
alter table public.journal_entries alter column headline drop not null;
alter table public.journal_entries alter column headline set default '';

-- Add entry type for structured capture modes
alter table public.journal_entries add column if not exists
  entry_type text not null default 'free-write'
  check (entry_type in ('free-write', 'check-in', 'gratitude', 'letter', 'dream'));

-- Streak tracking on profiles
alter table public.profiles add column if not exists current_streak integer not null default 0;
alter table public.profiles add column if not exists longest_streak integer not null default 0;
alter table public.profiles add column if not exists last_entry_date date;
alter table public.profiles add column if not exists total_entries integer not null default 0;

-- Function to update streak on new journal entry
create or replace function public.update_streak_on_entry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := current_date;
  v_last date;
  v_current int;
  v_longest int;
  v_total int;
begin
  select last_entry_date, current_streak, longest_streak, total_entries
    into v_last, v_current, v_longest, v_total
    from public.profiles
    where id = new.user_id;

  -- Already wrote today — just bump total
  if v_last = v_today then
    update public.profiles
      set total_entries = v_total + 1
      where id = new.user_id;
    return new;
  end if;

  -- Consecutive day
  if v_last = v_today - 1 then
    v_current := v_current + 1;
  else
    -- Streak broken (or first entry ever)
    v_current := 1;
  end if;

  if v_current > v_longest then
    v_longest := v_current;
  end if;

  update public.profiles
    set current_streak = v_current,
        longest_streak = v_longest,
        last_entry_date = v_today,
        total_entries = v_total + 1
    where id = new.user_id;

  return new;
end;
$$;

drop trigger if exists on_journal_entry_created on public.journal_entries;
create trigger on_journal_entry_created
after insert on public.journal_entries
for each row execute procedure public.update_streak_on_entry();
