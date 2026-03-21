"use client";

import { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Search, Loader2,
  Feather, Smile, CloudRain, Droplets, Ghost, ScanEye, Star,
  TrendingUp, Minus, TrendingDown,
} from "lucide-react";

import { useMemory } from "@/hooks/use-memory";
import { useGravity, type GravityTheme } from "@/hooks/use-gravity";

/* ── helpers ─────────────────────────────────────────────────── */

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric",
  }).format(new Date(value));
}

const moodColor: Record<string, string> = {
  serious:        "bg-slate-400",
  funny:          "bg-amber-400",
  sad:            "bg-blue-400",
  sorrowful:      "bg-indigo-400",
  horror:         "bg-red-400",
  suspense:       "bg-orange-400",
  "soul-piercing": "bg-purple-400",
};

const moodIcon: Record<string, typeof Feather> = {
  serious:        Feather,
  funny:          Smile,
  sad:            CloudRain,
  sorrowful:      Droplets,
  horror:         Ghost,
  suspense:       ScanEye,
  "soul-piercing": Star,
};

/* ── Gravity Theme full card ─────────────────────────────────── */
function GravityCard({ theme, index }: { theme: GravityTheme; index: number }) {
  const isRising = theme.weight === "rising";
  const isFading = theme.weight === "fading";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.3 }}
      className={`rounded-2xl border p-5 ${
        isRising
          ? "border-[var(--gravity-200)] bg-gradient-to-br from-[var(--gravity-50)] to-white"
          : isFading
          ? "border-[var(--ink-200)] bg-gradient-to-br from-[var(--ink-100)] to-white"
          : "border-[var(--ink-300)]/40 bg-white/70"
      }`}
    >
      {/* Weight badge */}
      <div className="mb-3 flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
            isRising
              ? "bg-[var(--gravity-100)] text-[var(--gravity-700)]"
              : isFading
              ? "bg-[var(--ink-100)] text-[var(--ink-500)]"
              : "bg-[var(--ink-100)] text-[var(--ink-600)]"
          }`}
        >
          {isRising  && <TrendingUp   className="h-2.5 w-2.5" />}
          {isFading  && <TrendingDown className="h-2.5 w-2.5" />}
          {!isRising && !isFading && <Minus className="h-2.5 w-2.5" />}
          {theme.weight}
        </span>
        <span className="text-[11px] text-[var(--ink-400)]">{theme.entryCount} entries</span>
      </div>

      {/* Tension name */}
      <h3 className="font-display text-[1.2rem] font-semibold leading-snug text-[var(--ink-950)]">
        {theme.tension}
      </h3>

      {/* Description */}
      <p className="mt-2 text-sm leading-relaxed text-[var(--ink-700)]">{theme.description}</p>

      {/* Evolution */}
      <div className="mt-3 border-t border-[var(--ink-300)]/20 pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-400)] mb-1">
          How it&apos;s shifted
        </p>
        <p className="text-[13px] leading-relaxed text-[var(--ink-600)] italic">
          &ldquo;{theme.evolution}&rdquo;
        </p>
      </div>
    </motion.div>
  );
}

/* ── Mood calendar ───────────────────────────────────────────── */
function MoodCalendar({
  points,
}: {
  points: Array<{ date: string; count: number; topMood: string | null }>;
}) {
  const grid = useMemo(() => {
    const today = new Date();
    const days: Array<{ date: string; mood: string | null; count: number }> = [];
    const map = new Map(points.map((p) => [p.date, p]));

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const pt  = map.get(key);
      days.push({ date: key, mood: pt?.topMood ?? null, count: pt?.count ?? 0 });
    }
    return days;
  }, [points]);

  return (
    <div>
      <p className="section-label mb-3">30-day map</p>
      <div className="grid grid-cols-10 gap-1.5">
        {grid.map((day) => (
          <div
            key={day.date}
            title={`${day.date}${day.mood ? ` · ${day.mood} (${day.count})` : ""}`}
            className={`aspect-square rounded-md transition-all ${
              day.mood
                ? `${moodColor[day.mood] ?? "bg-[var(--ink-300)]"} opacity-${Math.min(100, 40 + day.count * 20)}`
                : "bg-[var(--ink-300)]/15"
            }`}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {Object.entries(moodIcon).map(([mood, Icon]) => (
          <div key={mood} className="flex items-center gap-1">
            <div className={`h-2 w-2 rounded-sm ${moodColor[mood]}`} />
            <Icon className="h-2.5 w-2.5 text-[var(--ink-500)]" />
            <span className="text-[10px] capitalize text-[var(--ink-500)]">{mood}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────── */
export default function MemoryPage() {
  const memory  = useMemory();
  const gravity = useGravity();

  useEffect(() => {
    void memory.loadSnapshot();
    void gravity.loadThemes();
  }, [memory.loadSnapshot, gravity.loadThemes]);

  const { snapshot, isLoading, query, setQuery, results, isRetrieving, handleRetrieve, error } = memory;

  return (
    <div className="page-container">

      {/* ── Gravity Themes — centerpiece ──────────────────────── */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="section-label">Your gravity</p>
            <p className="mt-0.5 text-xs text-[var(--ink-500)]">The tensions you keep returning to</p>
          </div>
        </div>

        {gravity.isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl bg-[var(--gravity-100)]" />
            ))}
          </div>
        ) : gravity.insufficient ? (
          <div className="rounded-2xl border border-[var(--gravity-200)] bg-[var(--gravity-50)] px-5 py-6 text-center">
            <TrendingUp className="mx-auto mb-3 h-6 w-6 text-[var(--gravity-600)]" />
            <p className="text-sm font-semibold text-[var(--ink-900)]">Keep writing</p>
            <p className="mt-1 text-sm text-[var(--ink-600)]">
              Your gravity themes emerge after {Math.max(0, 5 - (gravity.entryCount ?? 0))} more{" "}
              {5 - (gravity.entryCount ?? 0) === 1 ? "entry" : "entries"}.
            </p>
          </div>
        ) : gravity.themes.length === 0 && !gravity.isLoading ? (
          <div className="rounded-2xl border border-[var(--ink-300)]/40 bg-white/60 px-5 py-6 text-center">
            <Brain className="mx-auto mb-3 h-6 w-6 text-[var(--ink-300)]" />
            <p className="text-sm text-[var(--ink-500)]">
              No gravity themes found yet. Write more to surface your patterns.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {gravity.themes.map((theme, i) => (
              <GravityCard key={i} theme={theme} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* ── Search ───────────────────────────────────────────── */}
      <div className="mb-6">
        <p className="section-label mb-2">Search your memory</p>
        <div className="relative">
          <input
            className="w-full rounded-2xl border border-[var(--ink-300)]/50 bg-white/70 py-3 pl-4 pr-12 text-sm text-[var(--ink-900)] placeholder:text-[var(--ink-300)] transition-colors focus:border-[var(--ink-700)] focus:bg-white/90 focus:outline-none"
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
            {isRetrieving
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Search className="h-4 w-4" />
            }
          </button>
        </div>
      </div>

      {/* Search error */}
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

      {/* Search results */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <p className="section-label mb-3">
              {results.entries.length + results.compositions.length} memories
            </p>
            <div className="space-y-2.5">
              {[...results.entries, ...results.compositions].map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[var(--ink-300)]/35 bg-white/60 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--ink-950)] line-clamp-1">{item.title}</p>
                    <span className="shrink-0 rounded-full bg-[var(--sand-100)] px-2 py-0.5 text-[11px] capitalize text-[var(--ink-700)]">
                      {item.kind}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--ink-700)] line-clamp-2">{item.snippet}</p>
                  <p className="mt-2 text-xs italic text-[var(--ink-500)]">{item.whyRelated}</p>
                  <p className="mt-1 text-[11px] text-[var(--ink-300)]">{formatDate(item.created_at)}</p>
                </div>
              ))}
              {results.entries.length + results.compositions.length === 0 && (
                <p className="text-sm text-[var(--ink-500)]">Nothing found for that.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Snapshot ─────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-[var(--ink-300)]/15" />
          ))}
        </div>
      ) : snapshot ? (
        <div className="space-y-6">

          {/* Mood calendar */}
          {snapshot.timelinePoints.length > 0 && (
            <div className="rounded-2xl border border-[var(--ink-300)]/35 bg-white/60 p-4">
              <MoodCalendar points={snapshot.timelinePoints} />
            </div>
          )}

          {/* Weekly recap */}
          {snapshot.weeklyRecap.entryCount > 0 && (
            <div className="rounded-2xl bg-[var(--sand-50)] p-4">
              <p className="section-label mb-2">This week</p>
              <p className="text-sm text-[var(--ink-800)]">{snapshot.weeklyRecap.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs text-[var(--ink-700)]">
                  {snapshot.weeklyRecap.entryCount} entries
                </span>
                {snapshot.weeklyRecap.topMood && (
                  <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs capitalize text-[var(--ink-700)]">
                    mostly {snapshot.weeklyRecap.topMood}
                  </span>
                )}
                {snapshot.weeklyRecap.topThemes.slice(0, 3).map((t) => (
                  <span key={t} className="rounded-full bg-white/70 px-2.5 py-1 text-xs text-[var(--ink-700)]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Monthly recap */}
          {snapshot.monthlyRecap.entryCount > 0 && (
            <div className="rounded-2xl border border-[var(--ink-300)]/35 bg-white/60 p-4">
              <p className="section-label mb-2">This month</p>
              <p className="text-sm text-[var(--ink-800)]">{snapshot.monthlyRecap.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-[var(--sand-50)] px-2.5 py-1 text-xs text-[var(--ink-700)]">
                  {snapshot.monthlyRecap.entryCount} entries
                </span>
                {snapshot.monthlyRecap.topThemes.slice(0, 3).map((t) => (
                  <span key={t} className="rounded-full bg-[var(--sand-50)] px-2.5 py-1 text-xs text-[var(--ink-700)]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recurring moods */}
          {snapshot.recurringMoods.length > 0 && (
            <div>
              <p className="section-label mb-3">Emotional patterns</p>
              <div className="flex flex-wrap gap-2">
                {snapshot.recurringMoods.map(({ mood, count }) => {
                  const Icon = moodIcon[mood];
                  return (
                    <div
                      key={mood}
                      className="flex items-center gap-2 rounded-2xl border border-[var(--ink-300)]/35 bg-white/60 px-3 py-2"
                    >
                      {Icon && <Icon className="h-3.5 w-3.5 text-[var(--ink-500)]" />}
                      <p className="text-sm font-semibold capitalize text-[var(--ink-900)]">{mood}</p>
                      <p className="text-xs text-[var(--ink-400)]">{count}×</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recurring themes */}
          {snapshot.recurringThemes.length > 0 && (
            <div>
              <p className="section-label mb-3">Recurring themes</p>
              <div className="flex flex-wrap gap-2">
                {snapshot.recurringThemes.slice(0, 8).map(({ theme, count }) => (
                  <span
                    key={theme}
                    className="rounded-full border border-[var(--ink-300)]/35 bg-white/60 px-3 py-1.5 text-sm text-[var(--ink-800)]"
                  >
                    {theme}
                    <span className="ml-1 text-xs text-[var(--ink-400)]">×{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reflection moments */}
          {snapshot.reflectionMoments.length > 0 && (
            <div>
              <p className="section-label mb-3">
                Reflection moments ({snapshot.reflectionMoments.length})
              </p>
              <div className="space-y-2.5">
                {snapshot.reflectionMoments.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-[var(--ink-300)]/35 bg-white/60 p-4"
                  >
                    <p className="text-sm font-semibold text-[var(--ink-950)]">{item.title}</p>
                    <p className="mt-0.5 text-[11px] capitalize text-[var(--ink-500)]">
                      {item.mode} · {item.mood} · {formatDate(item.created_at)}
                    </p>
                    <p className="mt-2 text-sm italic text-[var(--ink-700)]">
                      &ldquo;{item.reflection.followUpQuestion}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {snapshot.recentEntryCount === 0 && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Brain className="h-10 w-10 text-[var(--ink-300)]" />
              <p className="text-sm text-[var(--ink-500)]">
                Your gravity builds as you write.
              </p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
