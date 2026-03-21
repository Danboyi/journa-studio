"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  CloudRain,
  Droplets,
  Eye,
  Feather,
  Flame,
  Footprints,
  Ghost,
  Heart,
  HelpCircle,
  Lightbulb,
  Mail,
  Mic,
  MicOff,
  Moon,
  PenLine,
  ScanEye,
  Smile,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
  X,
} from "lucide-react";

import { useJournal } from "@/hooks/use-journal";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { useGravity, type GravityTheme } from "@/hooks/use-gravity";
import { dailyPromptPack, entryTypePrompts, streakMilestones } from "@/lib/prompt-packs";
import type { CompositionHistoryItem, EntryType, NarrativeMood, ReflectionPayload } from "@/types/journa";

/* ── constants ──────────────────────────────────────────────── */

const PULL_QUESTIONS = [
  "What are you carrying into today that you haven't put down yet?",
  "What keeps coming back, even when you try to leave it?",
  "What would you write if you knew no one was reading?",
  "What changed this week that you haven't named yet?",
  "What are you pretending not to know?",
  "What question are you most afraid to answer honestly?",
  "What would you say to yourself one year from now?",
  "What feeling is underneath the feeling you've been showing?",
  "What are you waiting to begin?",
  "What are you holding that isn't yours to hold?",
  "When did you last feel completely like yourself?",
  "What does this moment want from you?",
];

function getDailyQuestion(nudgeText?: string): string {
  if (nudgeText) return nudgeText;
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
  );
  return PULL_QUESTIONS[dayOfYear % PULL_QUESTIONS.length];
}

const moods: NarrativeMood[] = [
  "serious", "funny", "sad", "sorrowful", "suspense", "soul-piercing", "horror",
];

const moodIcon: Record<NarrativeMood, typeof Feather> = {
  serious:        Feather,
  funny:          Smile,
  sad:            CloudRain,
  sorrowful:      Droplets,
  horror:         Ghost,
  suspense:       ScanEye,
  "soul-piercing": Star,
};

const moodColor: Record<NarrativeMood, string> = {
  serious:        "text-slate-500",
  funny:          "text-amber-500",
  sad:            "text-blue-400",
  sorrowful:      "text-indigo-400",
  horror:         "text-red-400",
  suspense:       "text-orange-400",
  "soul-piercing": "text-purple-400",
};

const entryTypes: { type: EntryType; label: string; icon: typeof PenLine; hint: string }[] = [
  { type: "free-write", label: "Write",   icon: PenLine, hint: "What's on your mind?" },
  { type: "check-in",   label: "Check in",icon: Zap,     hint: "One sentence. How are you?" },
  { type: "gratitude",  label: "Grateful",icon: Heart,   hint: "What are you thankful for today?" },
  { type: "letter",     label: "Letter",  icon: Mail,    hint: "Dear future me..." },
  { type: "dream",      label: "Dream",   icon: Moon,    hint: "Before it fades..." },
];

function formatDate(v: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  }).format(new Date(v));
}

function formatRelativeDate(v: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long", day: "numeric", year: "numeric",
  }).format(new Date(v));
}

/* ── Gravity theme mini card ─────────────────────────────────── */
function GravityMiniCard({ theme }: { theme: GravityTheme }) {
  const weightClass =
    theme.weight === "rising"  ? "weight-rising"  :
    theme.weight === "fading"  ? "weight-fading"  :
    "weight-stable";

  const cardClass =
    theme.weight === "rising" ? "card-gravity card-rising" :
    theme.weight === "fading" ? "card-gravity card-fading" :
    "card-gravity";

  return (
    <div className={`${cardClass} p-3.5 flex flex-col gap-2`} style={{ minWidth: "160px", maxWidth: "180px", flexShrink: 0 }}>
      <span className={`${weightClass} inline-flex items-center gap-1 self-start rounded-full px-2 py-0.5 text-[10px] font-semibold`}>
        {theme.weight === "rising"  && <TrendingUp className="h-2.5 w-2.5" />}
        {theme.weight === "fading"  && <span className="text-[8px]">↘</span>}
        {theme.weight === "stable"  && <span className="text-[8px]">→</span>}
        {theme.weight}
      </span>
      <p className="font-display text-sm font-semibold leading-snug text-[var(--ink-950)] line-clamp-2">
        {theme.tension}
      </p>
      <p className="text-[11px] leading-relaxed text-[var(--ink-600)] line-clamp-2">
        {theme.description}
      </p>
    </div>
  );
}

/* ── Reflection version card ─────────────────────────────────── */

const modeLabel: Record<string, string> = {
  "daily-journal": "Journal",
  story: "Story",
  essay: "Essay",
  "statement-of-purpose": "Statement",
  biography: "Biography",
  autobiography: "Autobiography",
  "life-documentation": "Life doc",
};

function ReflectionVersionCard({
  reflection,
  versionNumber,
  isExpanded,
  onToggle,
}: {
  reflection: CompositionHistoryItem;
  versionNumber: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const r = reflection.reflection as ReflectionPayload | null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-[var(--ink-300)]/30 bg-white/60"
    >
      {/* Header row — always visible */}
      <button
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[var(--sand-50)]"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="shrink-0 rounded-full bg-[var(--brand-300)]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--brand-700)]">
            v{versionNumber}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--ink-950)] line-clamp-1">
              {reflection.title}
            </p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="text-[11px] text-[var(--ink-500)]">
                {modeLabel[reflection.mode] ?? reflection.mode}
              </span>
              <span className="text-[11px] text-[var(--ink-300)]">·</span>
              <span className="text-[11px] capitalize text-[var(--ink-500)]">{reflection.mood}</span>
              <span className="text-[11px] text-[var(--ink-300)]">·</span>
              <span className="text-[11px] text-[var(--ink-400)]">
                {new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                }).format(new Date(reflection.created_at))}
              </span>
            </div>
          </div>
        </div>
        <ChevronRight
          className={`mt-0.5 h-4 w-4 shrink-0 text-[var(--ink-400)] transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
        />
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-[var(--ink-300)]/20 px-4 pb-4 pt-3">
              {/* Excerpt */}
              <p className="text-[13px] italic leading-relaxed text-[var(--ink-600)]">
                {reflection.excerpt}
              </p>

              {/* 4-part reflection breakdown */}
              {r && (
                <div className="space-y-2">
                  {[
                    { icon: Eye,         label: "What happened",         content: r.summary,             accent: "bg-white/80 border-[var(--ink-300)]/30" },
                    { icon: Footprints,  label: "What mattered",         content: r.whatMattered,        accent: "bg-[var(--gravity-50)] border-[var(--gravity-200)]" },
                    { icon: Lightbulb,   label: "Beneath the surface",   content: r.beneathTheSurface,   accent: "bg-[var(--brand-300)]/5 border-[var(--brand-300)]/25" },
                    { icon: HelpCircle,  label: "The question underneath",content: r.followUpQuestion,   accent: "bg-[var(--sand-50)] border-[var(--ink-300)]/30" },
                  ].map(({ icon: Icon, label, content, accent }) => (
                    <div key={label} className={`rounded-xl border p-3 ${accent}`}>
                      <div className="mb-1 flex items-center gap-1.5">
                        <Icon className="h-3 w-3 text-[var(--ink-400)]" strokeWidth={1.8} />
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--ink-400)]">
                          {label}
                        </p>
                      </div>
                      <p className="text-[13px] leading-relaxed text-[var(--ink-800)]">{content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Polished draft */}
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--ink-400)]">
                  Polished draft
                </p>
                <div className="rounded-xl border border-[var(--ink-300)]/25 bg-white/70 p-3.5 text-[13px] leading-[1.8] text-[var(--ink-900)] whitespace-pre-wrap">
                  {reflection.draft}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── page ───────────────────────────────────────────────────── */

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

  const { themes, isLoading: isLoadingThemes, insufficient, loadThemes } = useGravity();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused]         = useState(false);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [saved, setSaved]                 = useState(false);
  const [prompt] = useState(
    () => dailyPromptPack[Math.floor(Math.random() * dailyPromptPack.length)],
  );

  // Per-entry reflection state
  const [selectedEntryId, setSelectedEntryId]           = useState<string | null>(null);
  const [entryReflections, setEntryReflections]         = useState<CompositionHistoryItem[]>([]);
  const [isLoadingReflections, setIsLoadingReflections] = useState(false);
  const [expandedReflectionId, setExpandedReflectionId] = useState<string | null>(null);

  const { state: voiceState, interim, toggle: toggleVoice } = useVoiceInput({
    onTranscript: (text) => {
      setBody((prev) => (prev ? prev + " " + text.trim() : text.trim()));
      setIsFocused(true);
    },
  });

  const typePrompt = entryTypePrompts[entryType]?.[
    Math.floor(Date.now() / 86400000) % (entryTypePrompts[entryType]?.length ?? 1)
  ];

  useEffect(() => {
    void loadEntries();
    void loadStreak();
    void loadMemories();
    void loadNudges();
    void loadThemes();
  }, [loadEntries, loadStreak, loadMemories, loadNudges, loadThemes]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [body]);

  async function loadEntryReflections(entryId: string) {
    setIsLoadingReflections(true);
    setEntryReflections([]);
    try {
      const res = await fetch(`/api/journal/entries/${entryId}/reflections`);
      const payload = (await res.json()) as { reflections?: CompositionHistoryItem[] };
      if (res.ok && payload.reflections) {
        setEntryReflections(payload.reflections);
      }
    } catch {
      // non-critical — fail silently
    } finally {
      setIsLoadingReflections(false);
    }
  }

  async function handleSave() {
    const entry = await saveEntry();
    if (entry) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setSelectedEntryId(entry.id);
      setEntryReflections([]);
      setExpandedReflectionId(null);
    }
  }

  function handleReflect() {
    try {
      localStorage.setItem(
        "journa_compose_draft",
        JSON.stringify({ sourceText: body, mood, entryId: selectedEntryId ?? null }),
      );
    } catch { /* ignore */ }
    router.push("/reflect");
  }

  function enterCompose(type?: EntryType) {
    if (type) setEntryType(type);
    setTimeout(() => {
      textareaRef.current?.focus();
      setIsFocused(true);
    }, 50);
  }

  function exitCompose() {
    setBody("");
    setHeadline("");
    setIsFocused(false);
    setSelectedEntryId(null);
    setEntryReflections([]);
    setExpandedReflectionId(null);
    textareaRef.current?.blur();
  }

  const isComposing = isFocused || body.length > 0;
  const activeType  = entryTypes.find((t) => t.type === entryType) ?? entryTypes[0];
  const showHeadline = entryType === "free-write" || entryType === "letter";
  const pullQuestion = getDailyQuestion(nudges[0]?.text);

  return (
    <div className="page-container">

      <AnimatePresence mode="wait">
        {!isComposing ? (
          /* ── HOME VIEW ──────────────────────────────────────── */
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
          >
            {/* Streak banner */}
            <AnimatePresence>
              {streak.currentStreak > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-4 flex items-center gap-3 rounded-2xl border border-orange-200/70 bg-gradient-to-r from-orange-50 to-amber-50/80 px-4 py-3"
                >
                  <div className="flex items-center gap-1.5">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="text-base font-bold text-orange-600">{streak.currentStreak}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-orange-900">
                      {streakMilestones[streak.currentStreak] ??
                        (streak.currentStreak === 1
                          ? "First day — come back tomorrow."
                          : `${streak.currentStreak} day streak`)}
                    </p>
                    <p className="text-[11px] text-orange-700/60 mt-0.5">
                      {streak.wroteToday ? "Written today" : "Write to keep your streak"}
                    </p>
                  </div>
                  <p className="shrink-0 text-[11px] font-medium text-orange-600/50">
                    {streak.totalEntries} total
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* On this day */}
            <AnimatePresence>
              {memories.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-5"
                >
                  <p className="section-label mb-2">On this day</p>
                  <div className="space-y-2">
                    {memories.map((m) => (
                      <div
                        key={m.entry.id}
                        className="rounded-2xl border border-[var(--brand-300)]/20 bg-[var(--brand-300)]/6 px-4 py-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-[var(--brand-700)]">{m.label}</span>
                          <span className="text-[11px] text-[var(--ink-500)]">
                            {formatRelativeDate(m.entry.created_at)}
                          </span>
                        </div>
                        {m.entry.headline && (
                          <p className="mt-1 text-sm font-semibold text-[var(--ink-950)]">{m.entry.headline}</p>
                        )}
                        <p className="mt-0.5 text-sm text-[var(--ink-700)] line-clamp-2">{m.entry.body}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pull Question Card */}
            <motion.div
              className="question-card mb-6 p-5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.3 }}
            >
              {/* Nudge indicator */}
              {nudges.length > 0 && (
                <div className="mb-3 flex items-center gap-1.5">
                  <Lightbulb className="h-3 w-3 text-[var(--brand-700)]" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-700)]">
                    From your history
                  </span>
                </div>
              )}

              <p className="font-display text-[1.3rem] leading-[1.3] font-semibold text-[var(--ink-950)]">
                {pullQuestion}
              </p>

              {/* Action buttons */}
              <div className="mt-5 flex items-center gap-2">
                {voiceState !== "unsupported" && (
                  <button
                    onClick={() => {
                      enterCompose();
                      setTimeout(() => toggleVoice(), 80);
                    }}
                    className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all active:scale-95 ${
                      voiceState === "listening"
                        ? "animate-pulse bg-red-500 text-white"
                        : "bg-[var(--ink-950)] text-white"
                    }`}
                  >
                    <Mic className="h-3.5 w-3.5" />
                    {voiceState === "listening" ? "Listening…" : "Voice"}
                  </button>
                )}
                <button
                  onClick={() => enterCompose("free-write")}
                  className="flex items-center gap-1.5 rounded-full border border-[var(--ink-300)]/60 bg-white/70 px-4 py-2.5 text-sm font-medium text-[var(--ink-800)] transition-all hover:bg-white active:scale-95"
                >
                  Write <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>

            {/* Gravity Themes */}
            <AnimatePresence>
              {(isLoadingThemes || themes.length > 0) && (
                <motion.div
                  className="mb-6"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12, duration: 0.28 }}
                >
                  <div className="mb-2.5 flex items-center justify-between">
                    <p className="section-label">Your gravity</p>
                    <button
                      onClick={() => router.push("/memory")}
                      className="text-[11px] font-medium text-[var(--ink-500)] transition-colors hover:text-[var(--ink-800)]"
                    >
                      See all →
                    </button>
                  </div>

                  {isLoadingThemes ? (
                    <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                      {[1, 2].map((i) => (
                        <div
                          key={i}
                          className="h-28 w-44 shrink-0 animate-pulse rounded-2xl bg-[var(--gravity-100)]"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                      {themes.slice(0, 3).map((theme, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + i * 0.06 }}
                          onClick={() => router.push("/memory")}
                          className="cursor-pointer"
                        >
                          <GravityMiniCard theme={theme} />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Entry type quick-access */}
            <div className="mb-5">
              <p className="section-label mb-2.5">Or start with</p>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {entryTypes.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.type}
                      onClick={() => enterCompose(t.type)}
                      className="flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--ink-300)]/50 bg-white/60 px-3.5 py-2 text-sm font-medium text-[var(--ink-700)] transition-all hover:bg-white hover:shadow-sm active:scale-95"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recent entries */}
            <div>
              <p className="section-label mb-2.5">Recent</p>

              {isLoading ? (
                <div className="space-y-2.5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-[72px] animate-pulse rounded-2xl bg-[var(--ink-300)]/15" />
                  ))}
                </div>
              ) : entries.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <PenLine className="h-7 w-7 text-[var(--ink-300)]" />
                  <p className="text-sm text-[var(--ink-500)]">Nothing yet. Answer the question above.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {entries.slice(0, 8).map((entry, i) => {
                    const MoodIconComp = moodIcon[entry.mood as NarrativeMood];
                    const moodColorClass = moodColor[entry.mood as NarrativeMood] ?? "text-[var(--ink-400)]";
                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="card card-hover cursor-pointer p-4 transition-all active:scale-[0.99]"
                        onClick={() => {
                          setSelectedEntryId(entry.id);
                          setHeadline(entry.headline ?? "");
                          setBody(entry.body);
                          setMood(entry.mood);
                          setEntryType(entry.entry_type ?? "free-write");
                          setExpandedReflectionId(null);
                          enterCompose();
                          void loadEntryReflections(entry.id);
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            {entry.entry_type && entry.entry_type !== "free-write" && (
                              <span className="mb-1 inline-block rounded-md bg-[var(--sand-100)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
                                {entry.entry_type}
                              </span>
                            )}
                            <p className="text-sm font-semibold text-[var(--ink-950)] line-clamp-1">
                              {entry.headline || entry.body.slice(0, 70)}
                            </p>
                            {entry.headline && (
                              <p className="mt-0.5 text-[13px] text-[var(--ink-600)] line-clamp-1">
                                {entry.body.slice(0, 80)}
                              </p>
                            )}
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
                            <span className="text-[11px] text-[var(--ink-400)]">
                              {formatDate(entry.created_at)}
                            </span>
                            {MoodIconComp && (
                              <MoodIconComp className={`h-3 w-3 ${moodColorClass}`} />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>

        ) : (
          /* ── COMPOSE VIEW ───────────────────────────────────── */
          <motion.div
            key="compose"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {/* Top row: entry types + close */}
            <div className="mb-4 flex items-center gap-2">
              <div className="flex flex-1 gap-2 overflow-x-auto pb-0.5 no-scrollbar">
                {entryTypes.map((t) => {
                  const Icon = t.icon;
                  const active = t.type === entryType;
                  return (
                    <button
                      key={t.type}
                      onClick={() => {
                        setEntryType(t.type);
                        textareaRef.current?.focus();
                      }}
                      className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium transition-all active:scale-95 ${
                        active
                          ? "bg-[var(--ink-950)] text-white"
                          : "border border-[var(--ink-300)]/50 bg-white/60 text-[var(--ink-700)] hover:bg-white"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {/* Close / back to home */}
              {!body && (
                <button
                  onClick={exitCompose}
                  className="flex shrink-0 items-center justify-center rounded-full border border-[var(--ink-300)]/50 bg-white/60 p-2 text-[var(--ink-500)] transition-all hover:text-[var(--ink-900)] active:scale-90"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Headline (free-write + letter) */}
            <AnimatePresence>
              {showHeadline && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <input
                    className="mb-1 w-full border-0 bg-transparent text-lg font-semibold text-[var(--ink-950)] placeholder:text-[var(--ink-300)] focus:outline-none"
                    placeholder={entryType === "letter" ? "Dear future me…" : "Give it a title…"}
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Body textarea */}
            <div className="relative min-h-[120px]">
              <textarea
                ref={textareaRef}
                className="w-full resize-none border-0 bg-transparent text-base leading-[1.7] text-[var(--ink-900)] placeholder:text-[var(--ink-300)] focus:outline-none"
                placeholder={
                  voiceState === "listening"
                    ? "Listening…"
                    : activeType.hint
                }
                rows={entryType === "check-in" ? 3 : 7}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => !body && setIsFocused(false)}
                style={{ minHeight: entryType === "check-in" ? "72px" : "144px" }}
              />
              {interim && (
                <p className="mt-1 text-base leading-relaxed text-[var(--ink-400)] italic">{interim}</p>
              )}
              {body.length > 0 && (
                <p className="text-right text-[11px] text-[var(--ink-300)]">{body.length}</p>
              )}
            </div>

            {/* Divider */}
            <div className="my-4 h-px bg-[var(--ink-300)]/25" />

            {/* Mood + actions */}
            <div className="flex items-center gap-3">
              {/* Mood picker */}
              <div className="relative">
                <button
                  onClick={() => setShowMoodPicker(!showMoodPicker)}
                  className="flex items-center gap-1.5 rounded-full border border-[var(--ink-300)]/60 bg-white/60 px-3 py-1.5 text-sm text-[var(--ink-700)] transition-colors hover:bg-white"
                >
                  {(() => { const Icon = moodIcon[mood]; return <Icon className={`h-3.5 w-3.5 ${moodColor[mood]}`} />; })()}
                  <span className="capitalize">{mood}</span>
                  <ChevronDown className="h-3 w-3 text-[var(--ink-500)]" />
                </button>

                <AnimatePresence>
                  {showMoodPicker && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 8 }}
                      className="absolute bottom-full left-0 z-50 mb-2 w-44 overflow-hidden rounded-2xl border border-[var(--ink-300)]/50 bg-white/96 p-2 shadow-2xl backdrop-blur-xl"
                    >
                      {moods.map((m) => {
                        const Icon = moodIcon[m];
                        return (
                          <button
                            key={m}
                            onClick={() => { setMood(m); setShowMoodPicker(false); }}
                            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors ${
                              m === mood
                                ? "bg-[var(--ink-950)] text-white"
                                : "text-[var(--ink-800)] hover:bg-[var(--sand-50)]"
                            }`}
                          >
                            <Icon className={`h-3.5 w-3.5 ${m === mood ? "text-white" : moodColor[m]}`} />
                            <span className="capitalize">{m}</span>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex flex-1 items-center justify-end gap-2">
                {/* Voice */}
                {voiceState !== "unsupported" && (
                  <button
                    onClick={toggleVoice}
                    title={voiceState === "listening" ? "Stop" : "Speak"}
                    className={`flex items-center justify-center rounded-full p-2 transition-all active:scale-90 ${
                      voiceState === "listening"
                        ? "animate-pulse bg-red-500 text-white shadow-md shadow-red-200"
                        : "border border-[var(--ink-300)]/60 bg-white/60 text-[var(--ink-600)] hover:bg-white"
                    }`}
                  >
                    {voiceState === "listening"
                      ? <MicOff className="h-4 w-4" />
                      : <Mic className="h-4 w-4" />
                    }
                  </button>
                )}

                {/* Save */}
                <button
                  onClick={handleSave}
                  disabled={isSaving || !body.trim()}
                  className="flex items-center gap-1.5 rounded-full bg-[var(--ink-950)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all active:scale-95 disabled:opacity-40"
                >
                  {saved
                    ? <><Check className="h-4 w-4" /> Saved</>
                    : isSaving ? "Saving…" : "Save"
                  }
                </button>

                {/* Reflect */}
                {entryType !== "check-in" && (
                  <button
                    onClick={handleReflect}
                    disabled={!body.trim()}
                    className="flex items-center gap-1.5 rounded-full border border-[var(--ink-300)]/60 bg-white/60 px-4 py-2 text-sm font-medium text-[var(--ink-800)] transition-all active:scale-95 disabled:opacity-40"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Reflect
                  </button>
                )}
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 cursor-pointer rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700"
                  onClick={clearError}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Per-entry reflection history ─────────────────── */}
            <AnimatePresence>
              {selectedEntryId && (isLoadingReflections || entryReflections.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-6"
                >
                  <div className="mb-2.5 flex items-center gap-2">
                    <p className="section-label">Reflections on this entry</p>
                    {entryReflections.length > 0 && (
                      <span className="rounded-full bg-[var(--brand-300)]/20 px-2 py-0.5 text-[10px] font-bold text-[var(--brand-700)]">
                        {entryReflections.length}
                      </span>
                    )}
                  </div>

                  {isLoadingReflections ? (
                    <div className="space-y-2">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-14 animate-pulse rounded-2xl bg-[var(--ink-300)]/10" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {entryReflections.map((ref, i) => (
                        <ReflectionVersionCard
                          key={ref.id}
                          reflection={ref}
                          versionNumber={entryReflections.length - i}
                          isExpanded={expandedReflectionId === ref.id}
                          onToggle={() =>
                            setExpandedReflectionId(
                              expandedReflectionId === ref.id ? null : ref.id,
                            )
                          }
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
