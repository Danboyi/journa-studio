"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Search, Loader2 } from "lucide-react";

import { useMemory } from "@/hooks/use-memory";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default function MemoryPage() {
  const memory = useMemory();
  const { loadSnapshot } = memory;

  useEffect(() => { void loadSnapshot(); }, [loadSnapshot]);

  const { snapshot, isLoading, query, setQuery, results, isRetrieving, handleRetrieve, error } = memory;

  return (
    <div className="page-container">
      {/* Search */}
      <div className="mb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">Search your memory</p>
        <div className="relative">
          <input
            className="w-full rounded-2xl border border-[var(--ink-300)] bg-white/70 py-3 pl-4 pr-12 text-sm text-[var(--ink-900)] placeholder:text-[var(--ink-300)] focus:border-[var(--ink-700)] focus:outline-none"
            placeholder="What do you want to remember?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void handleRetrieve()}
          />
          <button
            onClick={() => void handleRetrieve()}
            disabled={isRetrieving || !query.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl bg-[var(--ink-950)] p-1.5 text-white disabled:opacity-40"
          >
            {isRetrieving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Retrieval results */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">
              Found {results.entries.length + results.compositions.length} memories
            </p>
            <div className="space-y-3">
              {[...results.entries, ...results.compositions].map((item) => (
                <div key={item.id} className="rounded-2xl border border-[var(--ink-300)]/30 bg-white/60 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--ink-950)] line-clamp-1">{item.title}</p>
                    <span className="shrink-0 rounded-full bg-[var(--sand-100)] px-2 py-0.5 text-xs capitalize text-[var(--ink-700)]">
                      {item.kind}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--ink-700)] line-clamp-2">{item.snippet}</p>
                  <p className="mt-2 text-xs italic text-[var(--ink-500)]">{item.whyRelated}</p>
                  <p className="mt-1 text-xs text-[var(--ink-300)]">{formatDate(item.created_at)}</p>
                </div>
              ))}
              {results.entries.length + results.compositions.length === 0 && (
                <p className="text-sm text-[var(--ink-500)]">No memories found for that query.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Snapshot */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-[var(--ink-300)]/20" />
          ))}
        </div>
      ) : snapshot ? (
        <div className="space-y-6">
          {/* Weekly recap */}
          {snapshot.weeklyRecap.entryCount > 0 && (
            <div className="rounded-2xl bg-[var(--sand-50)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">This week</p>
              <p className="mt-2 text-sm text-[var(--ink-800)]">{snapshot.weeklyRecap.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs text-[var(--ink-700)]">
                  {snapshot.weeklyRecap.entryCount} entries
                </span>
                {snapshot.weeklyRecap.topMood && (
                  <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs capitalize text-[var(--ink-700)]">
                    mostly {snapshot.weeklyRecap.topMood}
                  </span>
                )}
                {snapshot.weeklyRecap.topThemes.slice(0, 3).map((theme) => (
                  <span key={theme} className="rounded-full bg-white/70 px-2.5 py-1 text-xs text-[var(--ink-700)]">{theme}</span>
                ))}
              </div>
            </div>
          )}

          {/* Monthly recap */}
          {snapshot.monthlyRecap.entryCount > 0 && (
            <div className="rounded-2xl border border-[var(--ink-300)]/30 bg-white/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">This month</p>
              <p className="mt-2 text-sm text-[var(--ink-800)]">{snapshot.monthlyRecap.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-[var(--sand-50)] px-2.5 py-1 text-xs text-[var(--ink-700)]">
                  {snapshot.monthlyRecap.entryCount} entries
                </span>
                {snapshot.monthlyRecap.topThemes.slice(0, 3).map((theme) => (
                  <span key={theme} className="rounded-full bg-[var(--sand-50)] px-2.5 py-1 text-xs text-[var(--ink-700)]">{theme}</span>
                ))}
              </div>
            </div>
          )}

          {/* Recurring moods */}
          {snapshot.recurringMoods.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">Your emotional patterns</p>
              <div className="flex flex-wrap gap-2">
                {snapshot.recurringMoods.map(({ mood, count }) => (
                  <div key={mood} className="rounded-2xl border border-[var(--ink-300)]/30 bg-white/60 px-3 py-2 text-center">
                    <p className="text-sm font-semibold capitalize text-[var(--ink-900)]">{mood}</p>
                    <p className="text-xs text-[var(--ink-500)]">{count}×</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recurring themes */}
          {snapshot.recurringThemes.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">Recurring themes</p>
              <div className="flex flex-wrap gap-2">
                {snapshot.recurringThemes.slice(0, 8).map(({ theme, count }) => (
                  <span key={theme} className="rounded-full border border-[var(--ink-300)]/30 bg-white/60 px-3 py-1.5 text-sm text-[var(--ink-800)]">
                    {theme} <span className="text-xs text-[var(--ink-500)]">×{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reflection moments */}
          {snapshot.reflectionMoments.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">
                Reflection moments ({snapshot.reflectionMoments.length})
              </p>
              <div className="space-y-3">
                {snapshot.reflectionMoments.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-[var(--ink-300)]/30 bg-white/60 p-4">
                    <p className="text-sm font-semibold text-[var(--ink-950)]">{item.title}</p>
                    <p className="mt-1 text-xs text-[var(--ink-500)] capitalize">{item.mode} · {item.mood} · {formatDate(item.created_at)}</p>
                    <p className="mt-2 text-sm italic text-[var(--ink-700)]">&ldquo;{item.reflection.followUpQuestion}&rdquo;</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {snapshot.recentEntryCount === 0 && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Brain className="h-10 w-10 text-[var(--ink-300)]" />
              <p className="text-sm text-[var(--ink-500)]">Your memory builds as you write. Start with a journal entry.</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
