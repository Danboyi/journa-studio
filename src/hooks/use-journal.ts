"use client";

import { useState, useCallback } from "react";
import type { EntryType, JournalEntry, NarrativeMood, StreakInfo } from "@/types/journa";

interface OnThisDayMemory {
  entry: Pick<JournalEntry, "id" | "headline" | "body" | "mood" | "entry_type" | "created_at">;
  label: string;
}

interface Nudge {
  text: string;
  type: string;
}

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState<NarrativeMood>("serious");
  const [entryType, setEntryType] = useState<EntryType>("free-write");

  // Streak state
  const [streak, setStreak] = useState<StreakInfo & { wroteToday: boolean }>({
    currentStreak: 0,
    longestStreak: 0,
    lastEntryDate: null,
    totalEntries: 0,
    wroteToday: false,
  });
  const [streakLoading, setStreakLoading] = useState(false);

  // On This Day state
  const [memories, setMemories] = useState<OnThisDayMemory[]>([]);

  // Nudge state
  const [nudges, setNudges] = useState<Nudge[]>([]);

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

  const loadStreak = useCallback(async () => {
    setStreakLoading(true);
    try {
      const res = await fetch("/api/journal/streak");
      const payload = (await res.json()) as { streak?: StreakInfo & { wroteToday: boolean } };
      if (res.ok && payload.streak) {
        setStreak(payload.streak);
      }
    } catch {
      // Streak is non-critical, fail silently
    } finally {
      setStreakLoading(false);
    }
  }, []);

  const loadMemories = useCallback(async () => {
    try {
      const res = await fetch("/api/journal/on-this-day");
      const payload = (await res.json()) as { memories?: OnThisDayMemory[] };
      if (res.ok && payload.memories) {
        setMemories(payload.memories);
      }
    } catch {
      // Non-critical
    }
  }, []);

  const loadNudges = useCallback(async () => {
    try {
      const res = await fetch("/api/journal/nudge");
      const payload = (await res.json()) as { nudges?: Nudge[] };
      if (res.ok && payload.nudges) {
        setNudges(payload.nudges);
      }
    } catch {
      // Non-critical
    }
  }, []);

  const saveEntry = useCallback(async (): Promise<JournalEntry | null> => {
    if (!body.trim()) {
      setError("Write something first.");
      return null;
    }
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/journal/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: headline || undefined,
          body,
          mood,
          entryType,
          shouldRefine: false,
        }),
      });
      const payload = (await res.json()) as { entry?: JournalEntry; error?: string };
      if (!res.ok || !payload.entry) {
        setError(payload.error ?? "Could not save entry.");
        return null;
      }
      setEntries((prev) => [payload.entry!, ...prev]);
      setBody("");
      setHeadline("");

      // Update streak optimistically
      setStreak((prev) => ({
        ...prev,
        currentStreak: prev.wroteToday ? prev.currentStreak : prev.currentStreak + 1,
        totalEntries: prev.totalEntries + 1,
        wroteToday: true,
      }));

      return payload.entry;
    } catch {
      setError("Could not save entry.");
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [headline, body, mood, entryType]);

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
    entryType,
    setEntryType,
    loadEntries,
    saveEntry,
    // Streak
    streak,
    streakLoading,
    loadStreak,
    // On This Day
    memories,
    loadMemories,
    // Nudges
    nudges,
    loadNudges,
  };
}
