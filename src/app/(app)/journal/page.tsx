"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, BookOpen, Check, ChevronDown } from "lucide-react";

import { useJournal } from "@/hooks/use-journal";
import { dailyPromptPack } from "@/lib/prompt-packs";
import type { NarrativeMood } from "@/types/journa";

const moods: NarrativeMood[] = ["serious", "funny", "sad", "sorrowful", "suspense", "soul-piercing", "horror"];

const moodEmoji: Record<NarrativeMood, string> = {
  serious: "🧘",
  funny: "😄",
  sad: "😞",
  sorrowful: "💙",
  horror: "😨",
  suspense: "😬",
  "soul-piercing": "✨",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function JournalPage() {
  const router = useRouter();
  const {
    entries, isLoading, isSaving, error, clearError,
    headline, setHeadline,
    body, setBody,
    mood, setMood,
    loadEntries, saveEntry,
  } = useJournal();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [saved, setSaved] = useState(false);
  const [prompt] = useState(() => dailyPromptPack[Math.floor(Math.random() * dailyPromptPack.length)]);

  useEffect(() => { void loadEntries(); }, [loadEntries]);

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

  const charCount = body.length;

  return (
    <div className="page-container">
      {/* Daily prompt */}
      <AnimatePresence>
        {!isFocused && body.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">
              Today&apos;s prompt
            </p>
            <p className="mt-1 text-sm text-[var(--ink-700)]">{prompt}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Headline */}
      <input
        className="w-full border-0 bg-transparent text-lg font-semibold text-[var(--ink-950)] placeholder:text-[var(--ink-300)] focus:outline-none"
        placeholder="Today in one sentence..."
        value={headline === "Today in one sentence" ? "" : headline}
        onChange={(e) => setHeadline(e.target.value || "Today in one sentence")}
        onFocus={() => setIsFocused(true)}
        onBlur={() => !body && setIsFocused(false)}
      />

      {/* Body */}
      <div className="relative mt-2">
        <textarea
          ref={textareaRef}
          className="w-full resize-none border-0 bg-transparent text-base leading-relaxed text-[var(--ink-900)] placeholder:text-[var(--ink-300)] focus:outline-none"
          placeholder="What happened today? What's on your mind?"
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => !body && setIsFocused(false)}
          style={{ minHeight: "120px" }}
        />
        {body.length > 0 && (
          <p className="text-right text-xs text-[var(--ink-300)]">{charCount}</p>
        )}
      </div>

      {/* Divider */}
      <div className="my-4 h-px bg-[var(--ink-300)]/30" />

      {/* Mood + actions row */}
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
                    onClick={() => { setMood(m); setShowMoodPicker(false); }}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${m === mood ? "bg-[var(--ink-950)] text-white" : "text-[var(--ink-800)] hover:bg-[var(--sand-50)]"}`}
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
              <><Check className="h-4 w-4" /> Saved</>
            ) : isSaving ? (
              "Saving..."
            ) : (
              "Save"
            )}
          </button>

          {/* Reflect button */}
          <button
            onClick={handleReflect}
            disabled={!body.trim()}
            className="flex items-center gap-1.5 rounded-full border border-[var(--ink-300)] bg-white/70 px-4 py-2 text-sm font-medium text-[var(--ink-800)] transition-all active:scale-95 disabled:opacity-40"
          >
            Reflect <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Error */}
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

      {/* Past entries */}
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
            <p className="text-sm text-[var(--ink-500)]">No entries yet. Write your first one above.</p>
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
                  setHeadline(entry.headline);
                  setBody(entry.body);
                  setMood(entry.mood);
                  textareaRef.current?.focus();
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--ink-950)] line-clamp-1">{entry.headline}</p>
                  <span className="shrink-0 text-xs text-[var(--ink-500)]">{formatDate(entry.created_at)}</span>
                </div>
                <p className="mt-1 text-sm text-[var(--ink-700)] line-clamp-2">{entry.body}</p>
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
