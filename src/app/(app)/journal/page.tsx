"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Flame,
  Heart,
  Lightbulb,
  Mail,
  Moon,
  PenLine,
  Zap,
} from "lucide-react";

import { useJournal } from "@/hooks/use-journal";
import { dailyPromptPack, entryTypePrompts, streakMilestones } from "@/lib/prompt-packs";
import type { EntryType, NarrativeMood } from "@/types/journa";

/* ── constants ──────────────────────────────────────────── */

const moods: NarrativeMood[] = [
  "serious", "funny", "sad", "sorrowful", "suspense", "soul-piercing", "horror",
];

const moodEmoji: Record<NarrativeMood, string> = {
  serious: "🧘",
  funny: "😄",
  sad: "😞",
  sorrowful: "💙",
  horror: "😨",
  suspense: "😬",
  "soul-piercing": "✨",
};

const entryTypes: { type: EntryType; label: string; icon: typeof PenLine; hint: string }[] = [
  { type: "free-write", label: "Write", icon: PenLine, hint: "What's on your mind?" },
  { type: "check-in", label: "Check in", icon: Zap, hint: "One sentence. How are you?" },
  { type: "gratitude", label: "Grateful", icon: Heart, hint: "What are you thankful for today?" },
  { type: "letter", label: "Letter", icon: Mail, hint: "Dear future me..." },
  { type: "dream", label: "Dream", icon: Moon, hint: "Before it fades..." },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatRelativeDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

/* ── page ───────────────────────────────────────────────── */

export default function JournalPage() {
  const router = useRouter();
  const {
    entries, isLoading, isSaving, error, clearError,
    headline, setHeadline,
    body, setBody,
    mood, setMood,
    entryType, setEntryType,
    loadEntries, saveEntry,
    streak, loadStreak,
    memories, loadMemories,
    nudges, loadNudges,
  } = useJournal();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [saved, setSaved] = useState(false);
  const [prompt] = useState(() => dailyPromptPack[Math.floor(Math.random() * dailyPromptPack.length)]);

  // Entry-type-specific prompt
  const typePrompt = entryTypePrompts[entryType]?.[
    Math.floor(Date.now() / 86400000) % (entryTypePrompts[entryType]?.length ?? 1)
  ];

  useEffect(() => {
    void loadEntries();
    void loadStreak();
    void loadMemories();
    void loadNudges();
  }, [loadEntries, loadStreak, loadMemories, loadNudges]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [body]);

  async function handleSave() {
    const entry = await saveEntry();
    if (entry) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  function handleReflect() {
    try {
      localStorage.setItem("journa_compose_draft", JSON.stringify({ sourceText: body, mood }));
    } catch { /* ignore */ }
    router.push("/reflect");
  }

  const activeType = entryTypes.find((t) => t.type === entryType) ?? entryTypes[0];
  const showHeadline = entryType === "free-write" || entryType === "letter";

  return (
    <div className="page-container">
      {/* ── Streak banner ── */}
      <AnimatePresence>
        {streak.currentStreak > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 flex items-center gap-3 rounded-2xl border border-orange-200/60 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3"
          >
            <div className="flex items-center gap-1.5">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="text-lg font-bold text-orange-600">{streak.currentStreak}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-900">
                {streakMilestones[streak.currentStreak] ??
                  (streak.currentStreak === 1
                    ? "First day! Keep going tomorrow."
                    : `${streak.currentStreak} day streak`)}
              </p>
              <p className="text-xs text-orange-700/70">
                {streak.wroteToday ? "You wrote today" : "Write to keep your streak"}
                {streak.longestStreak > streak.currentStreak
                  ? ` · Best: ${streak.longestStreak} days`
                  : streak.currentStreak >= 7
                    ? " · Personal best!"
                    : ""}
              </p>
            </div>
            <p className="text-xs font-medium text-orange-600/60">{streak.totalEntries} total</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── On This Day ── */}
      <AnimatePresence>
        {memories.length > 0 && !isFocused && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-5"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">
              On this day
            </p>
            <div className="mt-2 space-y-2">
              {memories.map((m) => (
                <div
                  key={m.entry.id}
                  className="rounded-2xl border border-[var(--brand-300)]/20 bg-[var(--brand-300)]/5 px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[var(--brand-700)]">{m.label}</span>
                    <span className="text-xs text-[var(--ink-500)]">
                      {formatRelativeDate(m.entry.created_at)}
                    </span>
                  </div>
                  {m.entry.headline && (
                    <p className="mt-1 text-sm font-semibold text-[var(--ink-950)]">
                      {m.entry.headline}
                    </p>
                  )}
                  <p className="mt-0.5 text-sm text-[var(--ink-700)] line-clamp-2">
                    {m.entry.body}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Entry type pills ── */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {entryTypes.map((t) => {
          const Icon = t.icon;
          const active = t.type === entryType;
          return (
            <button
              key={t.type}
              onClick={() => {
                setEntryType(t.type);
                setBody("");
                setHeadline("");
                textareaRef.current?.focus();
              }}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-all active:scale-95 ${
                active
                  ? "bg-[var(--ink-950)] text-white shadow-sm"
                  : "border border-[var(--ink-300)]/50 bg-white/70 text-[var(--ink-700)] hover:bg-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── AI Nudges ── */}
      <AnimatePresence>
        {nudges.length > 0 && !isFocused && body.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mb-4 space-y-2"
          >
            {nudges.map((nudge, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 rounded-2xl border border-[var(--brand-300)]/30 bg-[var(--brand-300)]/5 px-4 py-3"
              >
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-700)]" />
                <p className="text-sm text-[var(--ink-800)]">{nudge.text}</p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Daily prompt (context-aware by entry type) ── */}
      <AnimatePresence>
        {!isFocused && body.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">
              {entryType === "free-write" ? "Today\u2019s prompt" : activeType.label + " prompt"}
            </p>
            <p className="mt-1 text-sm text-[var(--ink-700)]">
              {entryType === "free-write" ? prompt : typePrompt}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Headline (only for free-write + letter) ── */}
      <AnimatePresence>
        {showHeadline && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <input
              className="w-full border-0 bg-transparent text-lg font-semibold text-[var(--ink-950)] placeholder:text-[var(--ink-300)] focus:outline-none"
              placeholder={
                entryType === "letter" ? "Dear future me..." : "Today in one sentence..."
              }
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => !body && setIsFocused(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Body ── */}
      <div className="relative mt-2">
        <textarea
          ref={textareaRef}
          className="w-full resize-none border-0 bg-transparent text-base leading-relaxed text-[var(--ink-900)] placeholder:text-[var(--ink-300)] focus:outline-none"
          placeholder={activeType.hint}
          rows={entryType === "check-in" ? 2 : 6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => !body && setIsFocused(false)}
          style={{ minHeight: entryType === "check-in" ? "60px" : "120px" }}
        />
        {body.length > 0 && (
          <p className="text-right text-xs text-[var(--ink-300)]">{body.length}</p>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="my-4 h-px bg-[var(--ink-300)]/30" />

      {/* ── Mood + actions row ── */}
      <div className="flex items-center gap-3">
        {/* Mood picker */}
        <div className="relative">
          <button
            onClick={() => setShowMoodPicker(!showMoodPicker)}
            className="flex items-center gap-1.5 rounded-full border border-[var(--ink-300)] bg-white/70 px-3 py-1.5 text-sm text-[var(--ink-700)] transition-colors hover:bg-white"
          >
            <span>{moodEmoji[mood]}</span>
            <span className="capitalize">{mood}</span>
            <ChevronDown className="h-3 w-3 text-[var(--ink-500)]" />
          </button>

          <AnimatePresence>
            {showMoodPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                className="absolute bottom-full left-0 mb-2 z-50 w-44 rounded-2xl border border-[var(--ink-300)] bg-white/95 p-2 shadow-xl backdrop-blur-sm"
              >
                {moods.map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setMood(m);
                      setShowMoodPicker(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
                      m === mood
                        ? "bg-[var(--ink-950)] text-white"
                        : "text-[var(--ink-800)] hover:bg-[var(--sand-50)]"
                    }`}
                  >
                    <span>{moodEmoji[m]}</span>
                    <span className="capitalize">{m}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={isSaving || !body.trim()}
            className="flex items-center gap-1.5 rounded-full bg-[var(--ink-950)] px-4 py-2 text-sm font-medium text-white transition-all active:scale-95 disabled:opacity-40"
          >
            {saved ? (
              <>
                <Check className="h-4 w-4" /> Saved
              </>
            ) : isSaving ? (
              "Saving..."
            ) : (
              "Save"
            )}
          </button>

          {/* Reflect button (only for longer entries) */}
          {entryType !== "check-in" && (
            <button
              onClick={handleReflect}
              disabled={!body.trim()}
              className="flex items-center gap-1.5 rounded-full border border-[var(--ink-300)] bg-white/70 px-4 py-2 text-sm font-medium text-[var(--ink-800)] transition-all active:scale-95 disabled:opacity-40"
            >
              Reflect <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Error ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700"
            onClick={clearError}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Past entries ── */}
      <div className="mt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">
          Recent entries
        </p>

        {isLoading ? (
          <div className="mt-3 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-[var(--ink-300)]/20" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-2 py-8 text-center">
            <BookOpen className="h-8 w-8 text-[var(--ink-300)]" />
            <p className="text-sm text-[var(--ink-500)]">
              No entries yet. Write your first one above.
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {entries.slice(0, 10).map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="cursor-pointer rounded-2xl border border-[var(--ink-300)]/30 bg-white/60 p-4 backdrop-blur-sm transition-all active:scale-[0.99]"
                onClick={() => {
                  setHeadline(entry.headline ?? "");
                  setBody(entry.body);
                  setMood(entry.mood);
                  setEntryType(entry.entry_type ?? "free-write");
                  textareaRef.current?.focus();
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {entry.entry_type && entry.entry_type !== "free-write" && (
                      <span className="rounded-md bg-[var(--sand-100)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--ink-500)]">
                        {entry.entry_type}
                      </span>
                    )}
                    <p className="text-sm font-semibold text-[var(--ink-950)] line-clamp-1">
                      {entry.headline || entry.body.slice(0, 60)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-[var(--ink-500)]">
                    {formatDate(entry.created_at)}
                  </span>
                </div>
                {entry.headline && (
                  <p className="mt-1 text-sm text-[var(--ink-700)] line-clamp-2">{entry.body}</p>
                )}
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs">{moodEmoji[entry.mood as NarrativeMood]}</span>
                  <span className="text-xs capitalize text-[var(--ink-500)]">{entry.mood}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
