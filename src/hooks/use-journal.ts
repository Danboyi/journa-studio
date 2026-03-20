"use client";

import { useState, useCallback } from "react";
import type { JournalEntry, NarrativeMood } from "@/types/journa";

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [headline, setHeadline] = useState("Today in one sentence");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState<NarrativeMood>("serious");

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/journal/entries");
      const payload = (await res.json()) as { entries?: JournalEntry[]; error?: string };
      if (!res.ok || !payload.entries) {
        setError(payload.error ?? "Could not load entries.");
        return;
      }
      setEntries(payload.entries);
    } catch {
      setError("Could not load entries.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveEntry = useCallback(async (): Promise<JournalEntry | null> => {
    if (!headline.trim() || !body.trim()) {
      setError("Headline and entry are required.");
      return null;
    }
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/journal/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headline, body, mood, shouldRefine: false }),
      });
      const payload = (await res.json()) as { entry?: JournalEntry; error?: string };
      if (!res.ok || !payload.entry) {
        setError(payload.error ?? "Could not save entry.");
        return null;
      }
      setEntries((prev) => [payload.entry!, ...prev]);
      setBody("");
      setHeadline("Today in one sentence");
      return payload.entry;
    } catch {
      setError("Could not save entry.");
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [headline, body, mood]);

  const clearError = useCallback(() => setError(null), []);

  return {
    entries,
    isLoading,
    isSaving,
    error,
    clearError,
    headline,
    setHeadline,
    body,
    setBody,
    mood,
    setMood,
    loadEntries,
    saveEntry,
  };
}
