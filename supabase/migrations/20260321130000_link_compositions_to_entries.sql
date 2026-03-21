-- Link compositions back to the journal entry they were reflected from.
-- This enables per-entry reflection history and versioning.

ALTER TABLE public.compositions
  ADD COLUMN IF NOT EXISTS journal_entry_id UUID
    REFERENCES public.journal_entries(id)
    ON DELETE SET NULL;

-- Fast lookups: "give me all reflections for entry X, newest first"
CREATE INDEX IF NOT EXISTS idx_compositions_journal_entry_created
  ON public.compositions (journal_entry_id, created_at DESC)
  WHERE journal_entry_id IS NOT NULL;
