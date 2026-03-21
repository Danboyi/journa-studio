"use client";

import { useCallback, useState } from "react";
import type { GravityTheme } from "@/app/api/gravity/themes/route";

export type { GravityTheme };

interface GravityState {
  themes:       GravityTheme[];
  isLoading:    boolean;
  insufficient: boolean;
  entryCount:   number;
  error:        string | null;
  source:       "ai" | "demo" | null;
}

export function useGravity() {
  const [state, setState] = useState<GravityState>({
    themes:       [],
    isLoading:    false,
    insufficient: false,
    entryCount:   0,
    error:        null,
    source:       null,
  });

  const loadThemes = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));

    try {
      const res = await fetch("/api/gravity/themes");

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to load gravity themes");
      }

      const data = (await res.json()) as {
        themes:       GravityTheme[];
        insufficient: boolean;
        entryCount:   number;
        source:       "ai" | "demo";
      };

      setState({
        themes:       data.themes ?? [],
        isLoading:    false,
        insufficient: data.insufficient ?? false,
        entryCount:   data.entryCount ?? 0,
        error:        null,
        source:       data.source ?? null,
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error:     err instanceof Error ? err.message : "Unknown error",
      }));
    }
  }, []);

  return { ...state, loadThemes };
}
