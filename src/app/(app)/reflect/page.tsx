"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown, Loader2 } from "lucide-react";

import { useCompose } from "@/hooks/use-compose";
import type { NarrativeMood, StylePreset, WritingMode } from "@/types/journa";

const moodEmoji: Record<NarrativeMood, string> = {
  serious: "🧘", funny: "😄", sad: "😞", sorrowful: "💙",
  horror: "😨", suspense: "😬", "soul-piercing": "✨",
};

const templates = [
  {
    id: "reflect",
    label: "Reflect on this",
    description: "What really happened beneath the surface",
    mode: "essay" as WritingMode,
    stylePreset: "balanced" as StylePreset,
    mood: "serious" as NarrativeMood,
    emoji: "🪞",
  },
  {
    id: "story",
    label: "Turn into a story",
    description: "Shape the raw material into something vivid",
    mode: "story" as WritingMode,
    stylePreset: "cinematic" as StylePreset,
    mood: "serious" as NarrativeMood,
    emoji: "📖",
  },
  {
    id: "life",
    label: "Life narrative",
    description: "Connect to identity, memory, longer themes",
    mode: "autobiography" as WritingMode,
    stylePreset: "soulful" as StylePreset,
    mood: "serious" as NarrativeMood,
    emoji: "🌱",
  },
];

const moods: NarrativeMood[] = ["serious", "funny", "sad", "sorrowful", "suspense", "soul-piercing", "horror"];
const writingModes: WritingMode[] = ["daily-journal", "story", "essay", "statement-of-purpose", "biography", "autobiography", "life-documentation"];
const stylePresets: StylePreset[] = ["balanced", "cinematic", "academic", "minimalist", "soulful"];

export default function ReflectPage() {
  const compose = useCompose();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const didLoadDraft = useRef(false);

  // Pick up draft sent from journal page
  useEffect(() => {
    if (didLoadDraft.current) return;
    didLoadDraft.current = true;
    const draft = compose.loadDraft();
    if (draft) {
      compose.setComposeInput((prev) => ({
        ...prev,
        sourceText: draft.sourceText,
        mood: draft.mood,
      }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to result
  useEffect(() => {
    if (compose.result) {
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [compose.result]);

  function applyTemplate(template: typeof templates[number]) {
    compose.setComposeInput((prev) => ({
      ...prev,
      mode: template.mode,
      stylePreset: template.stylePreset,
      mood: template.mood,
    }));
  }

  return (
    <div className="page-container">
      {/* Quick templates */}
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">Quick start</p>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => applyTemplate(t)}
              className={`flex shrink-0 flex-col gap-1 rounded-2xl border p-3 text-left transition-all active:scale-95 ${
                compose.composeInput.mode === t.mode && compose.composeInput.stylePreset === t.stylePreset
                  ? "border-[var(--ink-950)] bg-[var(--ink-950)] text-white"
                  : "border-[var(--ink-300)] bg-white/60 text-[var(--ink-800)]"
              }`}
              style={{ minWidth: "130px" }}
            >
              <span className="text-lg">{t.emoji}</span>
              <span className="text-xs font-semibold">{t.label}</span>
              <span className={`text-xs ${compose.composeInput.mode === t.mode && compose.composeInput.stylePreset === t.stylePreset ? "text-white/70" : "text-[var(--ink-500)]"}`}>
                {t.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Source text */}
      <div className="mb-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">Your writing</p>
        <textarea
          className="w-full resize-none rounded-2xl border border-[var(--ink-300)] bg-white/70 px-4 py-3 text-sm leading-relaxed text-[var(--ink-900)] placeholder:text-[var(--ink-300)] focus:border-[var(--ink-700)] focus:outline-none"
          placeholder="Paste or write what you want the AI to work with..."
          rows={5}
          value={compose.composeInput.sourceText}
          onChange={(e) => compose.setComposeInput((prev) => ({ ...prev, sourceText: e.target.value }))}
        />
      </div>

      {/* Mood row */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setShowMoodPicker(!showMoodPicker)}
            className="flex items-center gap-1.5 rounded-full border border-[var(--ink-300)] bg-white/70 px-3 py-1.5 text-sm text-[var(--ink-700)]"
          >
            <span>{moodEmoji[compose.composeInput.mood]}</span>
            <span className="capitalize">{compose.composeInput.mood}</span>
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
                    onClick={() => { compose.setComposeInput((p) => ({ ...p, mood: m })); setShowMoodPicker(false); }}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm ${m === compose.composeInput.mood ? "bg-[var(--ink-950)] text-white" : "text-[var(--ink-800)] hover:bg-[var(--sand-50)]"}`}
                  >
                    <span>{moodEmoji[m]}</span>
                    <span className="capitalize">{m}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Advanced toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="ml-auto flex items-center gap-1 text-xs text-[var(--ink-500)]"
        >
          {showAdvanced ? "Less" : "More options"}
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
            className="mb-4 overflow-hidden"
          >
            <div className="space-y-3 rounded-2xl border border-[var(--ink-300)] bg-white/60 p-4">
              {/* Voice notes */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">Your voice</label>
                <textarea
                  className="mt-1 w-full resize-none rounded-xl border border-[var(--ink-300)] bg-white/70 px-3 py-2 text-sm leading-relaxed text-[var(--ink-900)] placeholder:text-[var(--ink-300)] focus:outline-none"
                  placeholder="How do you write? e.g. direct, honest, reflective..."
                  rows={2}
                  value={compose.composeInput.voiceNotes}
                  onChange={(e) => compose.setComposeInput((prev) => ({ ...prev, voiceNotes: e.target.value }))}
                />
              </div>

              {/* Mode + style row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">Mode</label>
                  <select
                    className="mt-1 w-full rounded-xl border border-[var(--ink-300)] bg-white/70 px-3 py-2 text-sm text-[var(--ink-800)] focus:outline-none"
                    value={compose.composeInput.mode}
                    onChange={(e) => compose.setComposeInput((prev) => ({ ...prev, mode: e.target.value as WritingMode }))}
                  >
                    {writingModes.map((m) => (
                      <option key={m} value={m}>{m.replace(/-/g, " ")}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">Style</label>
                  <select
                    className="mt-1 w-full rounded-xl border border-[var(--ink-300)] bg-white/70 px-3 py-2 text-sm text-[var(--ink-800)] focus:outline-none"
                    value={compose.composeInput.stylePreset}
                    onChange={(e) => compose.setComposeInput((prev) => ({ ...prev, stylePreset: e.target.value as StylePreset }))}
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
            className="mb-3 text-sm text-[var(--ink-500)]"
          >
            {compose.composeStatus}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Generate button */}
      <button
        onClick={() => void compose.generateDraft()}
        disabled={compose.isLoading || !compose.composeInput.sourceText.trim()}
        className="w-full rounded-2xl bg-[var(--ink-950)] py-3.5 text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
      >
        {compose.isLoading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Writing...</>
        ) : (
          <><Sparkles className="h-4 w-4" /> Generate</>
        )}
      </button>

      {/* Error */}
      <AnimatePresence>
        {compose.error && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700"
            onClick={compose.clearError}
          >
            {compose.error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {compose.result && (
          <motion.div
            ref={resultRef}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-4"
          >
            {/* Title + excerpt */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">
                {compose.result.reflection ? "Reflection" : "Draft"}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-[var(--ink-950)]">{compose.result.title}</h2>
              <p className="mt-1 text-sm text-[var(--ink-700)]">{compose.result.excerpt}</p>
            </div>

            {/* Reflection breakdown */}
            {compose.result.reflection && (
              <div className="grid gap-3 rounded-2xl bg-[var(--sand-50)] p-4 sm:grid-cols-2">
                {[
                  { label: "What happened", value: compose.result.reflection.summary },
                  { label: "What mattered", value: compose.result.reflection.whatMattered },
                  { label: "Beneath the surface", value: compose.result.reflection.beneathTheSurface },
                  { label: "Follow-up question", value: compose.result.reflection.followUpQuestion },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">{label}</p>
                    <p className="mt-1 text-sm text-[var(--ink-800)]">{value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Draft text */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">
                {compose.result.reflection ? "Polished writing" : "Draft"}
              </p>
              <div className="mt-2 whitespace-pre-wrap rounded-2xl bg-white/70 p-4 text-sm leading-relaxed text-[var(--ink-900)] border border-[var(--ink-300)]/30">
                {compose.result.draft}
              </div>
            </div>

            {/* Editorial notes */}
            {compose.result.editorialNotes.length > 0 && (
              <div className="rounded-2xl bg-[var(--sand-50)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">What changed</p>
                <ul className="mt-2 space-y-1.5">
                  {compose.result.editorialNotes.map((note) => (
                    <li key={note} className="flex items-start gap-2 text-sm text-[var(--ink-700)]">
                      <span className="mt-0.5 text-[var(--ink-300)]">—</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Related memories */}
            {compose.relatedMemories && (compose.relatedMemories.entries.length > 0 || compose.relatedMemories.compositions.length > 0) && (
              <div className="rounded-2xl border border-[var(--ink-300)]/40 bg-white/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">Memory echoes</p>
                <p className="mt-1 text-xs text-[var(--ink-500)]">Journa found related writing in your past.</p>
                <div className="mt-3 space-y-2">
                  {[...compose.relatedMemories.entries, ...compose.relatedMemories.compositions].slice(0, 4).map((item) => (
                    <div key={item.id} className="rounded-xl bg-[var(--sand-50)] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[var(--ink-900)] line-clamp-1">{item.title}</p>
                        <span className="shrink-0 text-xs capitalize text-[var(--ink-500)]">{item.kind}</span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--ink-600)] line-clamp-2">{item.snippet}</p>
                      <p className="mt-1 text-xs text-[var(--ink-500)]">{item.whyRelated}</p>
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
