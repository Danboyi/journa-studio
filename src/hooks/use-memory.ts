"use client";

import { useState, useCallback } from "react";

export type MemorySnapshot = {
  recurringMoods: Array<{ mood: string; count: number }>;
  recurringThemes: Array<{ theme: string; count: number }>;
  reflectionMoments: Array<{
    id: string;
    title: string;
    excerpt: string;
    mode: string;
    mood: string;
    created_at: string;
    reflection: {
      summary: string;
      whatMattered: string;
      beneathTheSurface: string;
      followUpQuestion: string;
    };
  }>;
  weeklyRecap: {
    days: number;
    entryCount: number;
    topMood: string | null;
    topThemes: string[];
    summary: string;
  };
  monthlyRecap: {
    days: number;
    entryCount: number;
    topMood: string | null;
    topThemes: string[];
    summary: string;
  };
  timelinePoints: Array<{ date: string; count: number; topMood: string | null }>;
  moodTrend: Array<{ mood: string; count: number }>;
  recentEntryCount: number;
};

export type RetrievalItem = {
  id: string;
  kind: "entry" | "composition";
  title: string;
  mood: string;
  mode?: string;
  created_at: string;
  score: number;
  snippet: string;
  whyRelated: string;
};

export type RetrievalResults = {
  entries: RetrievalItem[];
  compositions: RetrievalItem[];
};

export function useMemory() {
  const [snapshot, setSnapshot] = useState<MemorySnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RetrievalResults | null>(null);
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSnapshot = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/copilot/memory");
      const payload = (await res.json()) as MemorySnapshot & { error?: string };
      if (!res.ok) {
        setError(payload.error ?? "Could not load memory.");
        return;
      }
      setSnapshot(payload);
    } catch {
      setError("Could not load memory.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const retrieve = useCallback(async (q: string): Promise<RetrievalResults | null> => {
    if (!q.trim()) return null;
    setIsRetrieving(true);
    setError(null);
    try {
      const res = await fetch(`/api/copilot/retrieve?q=${encodeURIComponent(q.trim())}`);
      const payload = (await res.json()) as {
        entries?: RetrievalItem[];
        compositions?: RetrievalItem[];
        error?: string;
      };
      if (!res.ok) {
        setError(payload.error ?? "Could not retrieve memories.");
        return null;
      }
      const data = { entries: payload.entries ?? [], compositions: payload.compositions ?? [] };
      setResults(data);
      return data;
    } catch {
      setError("Could not retrieve memories.");
      return null;
    } finally {
      setIsRetrieving(false);
    }
  }, []);

  const handleRetrieve = useCallback(async () => {
    if (!query.trim()) {
      setError("Enter something to search for.");
      return;
    }
    await retrieve(query);
  }, [query, retrieve]);

  const clearError = useCallback(() => setError(null), []);

  return {
    snapshot,
    isLoading,
    query,
    setQuery,
    results,
    isRetrieving,
    error,
    clearError,
    loadSnapshot,
    retrieve,
    handleRetrieve,
  };
}
