"use client";

import { useMemo, useState } from "react";
import { BookOpenText, Sparkles, WandSparkles } from "lucide-react";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { dailyPromptPack, lifeCyclePromptPack } from "@/lib/prompt-packs";
import type { ComposeRequest, ComposeResponse, NarrativeMood } from "@/types/journa";

const moods: NarrativeMood[] = [
  "funny",
  "serious",
  "sad",
  "sorrowful",
  "horror",
  "suspense",
  "soul-piercing",
];

export function JournaShell() {
  const [mode, setMode] = useState<"journal" | "copilot">("journal");
  const [journalText, setJournalText] = useState("");
  const [headline, setHeadline] = useState("Today in one sentence");
  const [mood, setMood] = useState<NarrativeMood>("serious");
  const [composeInput, setComposeInput] = useState<ComposeRequest>({
    mode: "essay",
    mood: "serious",
    voiceNotes: "I write like I speak: direct, honest, reflective.",
    sourceText: "",
  });
  const [result, setResult] = useState<ComposeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const dailyPrompts = useMemo(() => dailyPromptPack.slice(0, 3), []);
  const lifePrompts = useMemo(() => lifeCyclePromptPack.slice(0, 3), []);

  async function generateDraft() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/copilot/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(composeInput),
      });
      const data = (await res.json()) as ComposeResponse;
      setResult(data);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-[2.2rem] border border-white/50 bg-[radial-gradient(circle_at_top_left,_#cffafe_0,_#f8fafc_50%,_#fef3c7_100%)] p-6 sm:p-10"
      >
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[var(--brand-300)]/45 blur-3xl" />
        <Badge>My Journa</Badge>
        <h1 className="mt-4 max-w-3xl text-4xl leading-tight font-semibold tracking-tight text-[var(--ink-950)] sm:text-5xl">
          Personal journal meets an AI co-writer that keeps your real voice.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-[var(--ink-700)] sm:text-lg">
          Capture your day in plain human language. Journa asks better questions, keeps missing details, and composes polished stories, essays, SOPs, biographies, and life narratives in your tone.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            variant={mode === "journal" ? "default" : "secondary"}
            onClick={() => setMode("journal")}
          >
            <BookOpenText className="mr-2 h-4 w-4" /> Journal Mode
          </Button>
          <Button
            variant={mode === "copilot" ? "default" : "secondary"}
            onClick={() => setMode("copilot")}
          >
            <WandSparkles className="mr-2 h-4 w-4" /> Copilot Mode
          </Button>
        </div>
      </motion.section>

      {mode === "journal" ? (
        <section className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <Card className="p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[var(--ink-900)]">Daily Capture</h2>
              <Badge>{mood}</Badge>
            </div>
            <input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="mb-3 h-11 w-full rounded-xl border border-[var(--ink-300)] px-4 text-sm"
              placeholder="Headline"
            />
            <Textarea
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
              placeholder="Write exactly how you speak. No pressure to sound like a writer."
              className="min-h-[220px]"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {moods.map((tone) => (
                <Button
                  key={tone}
                  variant={tone === mood ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setMood(tone)}
                >
                  {tone}
                </Button>
              ))}
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <h3 className="text-sm font-semibold tracking-[0.12em] text-[var(--ink-700)] uppercase">
              Smart prompts
            </h3>
            <ul className="mt-3 space-y-3 text-sm text-[var(--ink-800)]">
              {dailyPrompts.map((prompt) => (
                <li key={prompt} className="rounded-xl bg-white/80 p-3">
                  {prompt}
                </li>
              ))}
            </ul>
            <Button className="mt-5 w-full" onClick={() => setComposeInput((prev) => ({ ...prev, sourceText: journalText, mood }))}>
              <Sparkles className="mr-2 h-4 w-4" /> Use entry in Copilot
            </Button>
          </Card>
        </section>
      ) : (
        <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Card className="p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-[var(--ink-900)]">Copilot Composer</h2>
            <p className="mt-1 text-sm text-[var(--ink-700)]">
              Transform rough notes into a polished draft while preserving voice.
            </p>
            <label className="mt-4 block text-sm font-medium">Voice profile</label>
            <Textarea
              className="mt-2 min-h-[100px]"
              value={composeInput.voiceNotes}
              onChange={(e) =>
                setComposeInput((prev) => ({ ...prev, voiceNotes: e.target.value }))
              }
            />

            <label className="mt-4 block text-sm font-medium">Source notes</label>
            <Textarea
              className="mt-2 min-h-[180px]"
              value={composeInput.sourceText}
              onChange={(e) =>
                setComposeInput((prev) => ({ ...prev, sourceText: e.target.value }))
              }
              placeholder="Paste journal entries, memories, project notes, or life events."
            />

            <div className="mt-4 flex flex-wrap gap-2">
              {moods.map((tone) => (
                <Button
                  key={tone}
                  variant={tone === composeInput.mood ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setComposeInput((prev) => ({ ...prev, mood: tone }))}
                >
                  {tone}
                </Button>
              ))}
            </div>

            <Button className="mt-5 w-full" onClick={generateDraft} disabled={isLoading}>
              {isLoading ? "Composing..." : "Generate polished draft"}
            </Button>
          </Card>

          <Card className="p-5 sm:p-6">
            <h3 className="text-sm font-semibold tracking-[0.12em] text-[var(--ink-700)] uppercase">
              Life-cycle prompts
            </h3>
            <ul className="mt-3 space-y-3 text-sm text-[var(--ink-800)]">
              {lifePrompts.map((prompt) => (
                <li key={prompt} className="rounded-xl bg-white/80 p-3">
                  {prompt}
                </li>
              ))}
            </ul>
            <div className="mt-5 rounded-xl bg-[var(--ink-950)] p-4 text-[var(--sand-50)]">
              <p className="text-xs tracking-[0.08em] uppercase">Output preview</p>
              <p className="mt-2 text-sm leading-relaxed">
                {result?.excerpt ??
                  "Your refined draft appears here with edit notes and structure."}
              </p>
            </div>
          </Card>
        </section>
      )}

      {result ? (
        <Card className="mt-8 p-5 sm:p-6">
          <h2 className="text-2xl font-semibold text-[var(--ink-950)]">{result.title}</h2>
          <p className="mt-2 text-sm text-[var(--ink-700)]">{result.excerpt}</p>
          <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-[var(--sand-50)] p-4 text-sm leading-relaxed text-[var(--ink-900)]">
            {result.draft}
          </pre>
          <ul className="mt-4 space-y-2 text-sm text-[var(--ink-700)]">
            {result.editorialNotes.map((note) => (
              <li key={note}>- {note}</li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
