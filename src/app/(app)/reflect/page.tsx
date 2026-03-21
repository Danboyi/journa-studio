"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, ChevronDown, Loader2,
  Feather, Smile, CloudRain, Droplets, Ghost, ScanEye, Star,
  Layers, BookText, Sprout,
  Eye, Footprints, HelpCircle, Lightbulb,
} from "lucide-react";

import { useCompose } from "@/hooks/use-compose";
import type { NarrativeMood, StylePreset, WritingMode } from "@/types/journa";

/* ── Mood icons ─────────────────────────────────────────────── */
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

/* ── Templates ──────────────────────────────────────────────── */
const templates = [
  {
    id:          "reflect",
    label:       "Understand this",
    description: "What's really going on beneath the surface",
    mode:        "essay"          as WritingMode,
    stylePreset: "balanced"       as StylePreset,
    mood:        "serious"        as NarrativeMood,
    icon:        Layers,
  },
  {
    id:          "story",
    label:       "Shape a story",
    description: "Turn raw experience into something vivid",
    mode:        "story"          as WritingMode,
    stylePreset: "cinematic"      as StylePreset,
    mood:        "serious"        as NarrativeMood,
    icon:        BookText,
  },
  {
    id:          "life",
    label:       "Life thread",
    description: "Connect to identity, memory, longer arcs",
    mode:        "autobiography"  as WritingMode,
    stylePreset: "soulful"        as StylePreset,
    mood:        "serious"        as NarrativeMood,
    icon:        Sprout,
  },
] as const;

const moods: NarrativeMood[] = [
  "serious", "funny", "sad", "sorrowful", "suspense", "soul-piercing", "horror",
];

const writingModes: WritingMode[] = [
  "daily-journal", "story", "essay", "statement-of-purpose",
  "biography", "autobiography", "life-documentation",
];

const stylePresets: StylePreset[] = ["balanced", "cinematic", "academic", "minimalist", "soulful"];

/* ── Reflection breakdown card ───────────────────────────────── */
interface BreakdownItem {
  icon:    typeof Eye;
  label:   string;
  content: string;
  accent:  string;
}

function BreakdownCard({ item, index }: { item: BreakdownItem; index: number }) {
  const Icon = item.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.28 }}
      className={`rounded-2xl border p-4 ${item.accent}`}
    >
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-[var(--ink-500)]" strokeWidth={1.8} />
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--ink-500)]">
          {item.label}
        </p>
      </div>
      <p className="text-sm leading-relaxed text-[var(--ink-800)]">{item.content}</p>
    </motion.div>
  );
}

/* ── Page ────────────────────────────────────────────────────── */

export default function ReflectPage() {
  const compose = useCompose();
  const [showAdvanced, setShowAdvanced]     = useState(false);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const resultRef  = useRef<HTMLDivElement>(null);
  const didLoadDraft = useRef(false);

  useEffect(() => {
    if (didLoadDraft.current) return;
    didLoadDraft.current = true;
    const draft = compose.loadDraft();
    if (draft) {
      compose.setComposeInput((prev) => ({
        ...prev,
        sourceText:     draft.sourceText,
        mood:           draft.mood,
        journalEntryId: draft.entryId ?? undefined,
      }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (compose.result) {
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    }
  }, [compose.result]);

  function applyTemplate(t: typeof templates[number]) {
    compose.setComposeInput((prev) => ({
      ...prev,
      mode:        t.mode,
      stylePreset: t.stylePreset,
      mood:        t.mood,
    }));
  }

  const activeTemplate = templates.find(
    (t) =>
      t.mode        === compose.composeInput.mode &&
      t.stylePreset === compose.composeInput.stylePreset,
  );

  return (
    <div className="page-container">

      {/* Mode templates */}
      <div className="mb-5">
        <p className="section-label mb-2.5">What do you want to do with this?</p>
        <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
          {templates.map((t) => {
            const Icon   = t.icon;
            const active = t.id === (activeTemplate?.id ?? "reflect");
            return (
              <button
                key={t.id}
                onClick={() => applyTemplate(t)}
                className={`flex shrink-0 flex-col gap-2 rounded-2xl border p-3.5 text-left transition-all active:scale-95 ${
                  active
                    ? "border-[var(--ink-950)] bg-[var(--ink-950)] text-white"
                    : "border-[var(--ink-300)]/50 bg-white/60 text-[var(--ink-800)] hover:bg-white hover:shadow-sm"
                }`}
                style={{ minWidth: "138px" }}
              >
                <Icon
                  className={`h-4 w-4 ${active ? "text-white" : "text-[var(--ink-600)]"}`}
                  strokeWidth={1.8}
                />
                <div>
                  <p className="text-[13px] font-semibold">{t.label}</p>
                  <p className={`mt-0.5 text-[11px] leading-snug ${active ? "text-white/65" : "text-[var(--ink-500)]"}`}>
                    {t.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Source text */}
      <div className="mb-4">
        <p className="section-label mb-2">Your writing</p>
        <textarea
          className="w-full resize-none rounded-2xl border border-[var(--ink-300)]/50 bg-white/70 px-4 py-3.5 text-sm leading-[1.7] text-[var(--ink-900)] placeholder:text-[var(--ink-300)] transition-colors focus:border-[var(--ink-700)] focus:bg-white/90 focus:outline-none"
          placeholder="Paste or write what you want to explore…"
          rows={5}
          value={compose.composeInput.sourceText}
          onChange={(e) =>
            compose.setComposeInput((prev) => ({ ...prev, sourceText: e.target.value }))
          }
        />
      </div>

      {/* Mood + advanced row */}
      <div className="mb-5 flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setShowMoodPicker(!showMoodPicker)}
            className="flex items-center gap-1.5 rounded-full border border-[var(--ink-300)]/60 bg-white/60 px-3 py-1.5 text-sm text-[var(--ink-700)] transition-colors hover:bg-white"
          >
            {(() => {
              const Icon = moodIcon[compose.composeInput.mood];
              return <Icon className={`h-3.5 w-3.5 ${moodColor[compose.composeInput.mood]}`} />;
            })()}
            <span className="capitalize">{compose.composeInput.mood}</span>
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
                  const active = m === compose.composeInput.mood;
                  return (
                    <button
                      key={m}
                      onClick={() => {
                        compose.setComposeInput((p) => ({ ...p, mood: m }));
                        setShowMoodPicker(false);
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors ${
                        active
                          ? "bg-[var(--ink-950)] text-white"
                          : "text-[var(--ink-800)] hover:bg-[var(--sand-50)]"
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${active ? "text-white" : moodColor[m]}`} />
                      <span className="capitalize">{m}</span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="ml-auto flex items-center gap-1 text-xs text-[var(--ink-500)] transition-colors hover:text-[var(--ink-700)]"
        >
          {showAdvanced ? "Less" : "Fine-tune"}
          <ChevronDown className={`h-3 w-3 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Advanced options */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5 overflow-hidden"
          >
            <div className="space-y-3 rounded-2xl border border-[var(--ink-300)]/40 bg-white/60 p-4">
              <div>
                <label className="section-label">Your voice</label>
                <textarea
                  className="mt-1.5 w-full resize-none rounded-xl border border-[var(--ink-300)]/50 bg-white/70 px-3 py-2.5 text-sm leading-relaxed text-[var(--ink-900)] placeholder:text-[var(--ink-300)] focus:outline-none"
                  placeholder="How do you write? e.g. direct, reflective, dry…"
                  rows={2}
                  value={compose.composeInput.voiceNotes}
                  onChange={(e) =>
                    compose.setComposeInput((prev) => ({ ...prev, voiceNotes: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="section-label">Mode</label>
                  <select
                    className="mt-1.5 w-full rounded-xl border border-[var(--ink-300)]/50 bg-white/70 px-3 py-2 text-sm text-[var(--ink-800)] focus:outline-none"
                    value={compose.composeInput.mode}
                    onChange={(e) =>
                      compose.setComposeInput((prev) => ({ ...prev, mode: e.target.value as WritingMode }))
                    }
                  >
                    {writingModes.map((m) => (
                      <option key={m} value={m}>{m.replace(/-/g, " ")}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="section-label">Style</label>
                  <select
                    className="mt-1.5 w-full rounded-xl border border-[var(--ink-300)]/50 bg-white/70 px-3 py-2 text-sm text-[var(--ink-800)] focus:outline-none"
                    value={compose.composeInput.stylePreset}
                    onChange={(e) =>
                      compose.setComposeInput((prev) => ({ ...prev, stylePreset: e.target.value as StylePreset }))
                    }
                  >
                    {stylePresets.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status */}
      <AnimatePresence>
        {compose.composeStatus && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-3 text-sm italic text-[var(--ink-500)]"
          >
            {compose.composeStatus}
          </motion.p>
        )}
      </AnimatePresence>

      {/* CTA */}
      <button
        onClick={() => void compose.generateDraft()}
        disabled={compose.isLoading || !compose.composeInput.sourceText.trim()}
        className="w-full rounded-2xl bg-[var(--ink-950)] py-4 text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
      >
        {compose.isLoading
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Working on it…</>
          : <><Sparkles className="h-4 w-4" /> {activeTemplate?.label ?? "Understand this"}</>
        }
      </button>

      {/* Error */}
      <AnimatePresence>
        {compose.error && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 cursor-pointer rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700"
            onClick={compose.clearError}
          >
            {compose.error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── RESULT ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {compose.result && (
          <motion.div
            ref={resultRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-5"
          >
            {/* Title */}
            <div>
              <p className="section-label mb-1.5">
                {compose.result.reflection ? "What this is about" : "Draft"}
              </p>
              <h2 className="font-display text-2xl font-semibold leading-tight text-[var(--ink-950)]">
                {compose.result.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-600)]">
                {compose.result.excerpt}
              </p>
            </div>

            {/* ── 4-part reflection breakdown ── */}
            {compose.result.reflection && (() => {
              const r = compose.result.reflection!;
              const breakdown: BreakdownItem[] = [
                {
                  icon:    Eye,
                  label:   "What happened",
                  content: r.summary,
                  accent:  "border-[var(--ink-300)]/40 bg-white/70",
                },
                {
                  icon:    Footprints,
                  label:   "What mattered",
                  content: r.whatMattered,
                  accent:  "border-[var(--gravity-200)] bg-[var(--gravity-50)]",
                },
                {
                  icon:    Lightbulb,
                  label:   "Beneath the surface",
                  content: r.beneathTheSurface,
                  accent:  "border-[var(--brand-300)]/30 bg-[var(--brand-300)]/5",
                },
                {
                  icon:    HelpCircle,
                  label:   "The question underneath",
                  content: r.followUpQuestion,
                  accent:  "border-[var(--ink-300)]/40 bg-[var(--sand-50)]",
                },
              ];
              return (
                <div className="space-y-2.5">
                  <p className="section-label">The breakdown</p>
                  {breakdown.map((item, i) => (
                    <BreakdownCard key={item.label} item={item} index={i} />
                  ))}
                </div>
              );
            })()}

            {/* Polished draft */}
            <div>
              <p className="section-label mb-2">
                {compose.result.reflection ? "Polished" : "Draft"}
              </p>
              <div className="rounded-2xl border border-[var(--ink-300)]/35 bg-white/70 p-5 text-sm leading-[1.8] text-[var(--ink-900)] whitespace-pre-wrap">
                {compose.result.draft}
              </div>
            </div>

            {/* Editorial notes */}
            {compose.result.editorialNotes.length > 0 && (
              <div className="rounded-2xl bg-[var(--sand-50)] p-4">
                <p className="section-label mb-2.5">What changed</p>
                <ul className="space-y-2">
                  {compose.result.editorialNotes.map((note) => (
                    <li key={note} className="flex items-start gap-2.5 text-sm text-[var(--ink-700)]">
                      <span className="mt-0.5 shrink-0 text-[var(--ink-300)]">—</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Memory echoes */}
            {compose.relatedMemories &&
              (compose.relatedMemories.entries.length > 0 ||
               compose.relatedMemories.compositions.length > 0) && (
              <div className="rounded-2xl border border-[var(--ink-300)]/35 bg-white/60 p-4">
                <p className="section-label mb-1">Memory echoes</p>
                <p className="mb-3 text-xs text-[var(--ink-500)]">
                  Related writing from your past.
                </p>
                <div className="space-y-2">
                  {[
                    ...compose.relatedMemories.entries,
                    ...compose.relatedMemories.compositions,
                  ].slice(0, 4).map((item) => (
                    <div key={item.id} className="rounded-xl bg-[var(--sand-50)] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[var(--ink-900)] line-clamp-1">
                          {item.title}
                        </p>
                        <span className="shrink-0 text-[11px] capitalize text-[var(--ink-500)]">
                          {item.kind}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--ink-600)] line-clamp-2">{item.snippet}</p>
                      <p className="mt-1 text-[11px] italic text-[var(--ink-500)]">{item.whyRelated}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
