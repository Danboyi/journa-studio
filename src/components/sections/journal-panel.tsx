import { Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { JournalEntry, NarrativeMood } from "@/types/journa";

type JournalPanelProps = {
  mood: NarrativeMood;
  moods: NarrativeMood[];
  headline: string;
  journalText: string;
  isAuthenticated: boolean;
  isSavingEntry: boolean;
  isEntriesLoading: boolean;
  entries: JournalEntry[];
  dailyPrompts: string[];
  setMood: (value: NarrativeMood) => void;
  setHeadline: (value: string) => void;
  setJournalText: (value: string) => void;
  onSaveEntry: () => void;
  onReflect: () => void;
  formatDate: (value: string) => string;
};

export function JournalPanel({
  mood,
  moods,
  headline,
  journalText,
  isAuthenticated,
  isSavingEntry,
  isEntriesLoading,
  entries,
  dailyPrompts,
  setMood,
  setHeadline,
  setJournalText,
  onSaveEntry,
  onReflect,
  formatDate,
}: JournalPanelProps) {
  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-[var(--ink-900)]">Daily Capture</h2>
            <p className="mt-1 text-sm text-[var(--ink-700)]">
              Start with one honest note. Journa can help you reflect on it after.
            </p>
          </div>
          <Badge>{mood}</Badge>
        </div>
        <input
          value={headline}
          onChange={(event) => setHeadline(event.target.value)}
          className="mb-3 h-11 w-full rounded-xl border border-[var(--ink-300)] px-4 text-sm"
          placeholder="Give this moment a simple title"
        />
        <Textarea
          value={journalText}
          onChange={(event) => setJournalText(event.target.value)}
          placeholder="Write exactly how you speak. No pressure to sound like a writer."
          className="min-h-[220px]"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {moods.map((tone) => (
            <Button key={tone} variant={tone === mood ? "default" : "secondary"} size="sm" onClick={() => setMood(tone)}>
              {tone}
            </Button>
          ))}
        </div>
        <div className="mt-4 rounded-2xl bg-[var(--sand-50)] p-4 text-sm text-[var(--ink-800)]">
          <p className="font-semibold text-[var(--ink-900)]">The ideal first-use loop</p>
          <ol className="mt-2 space-y-1 text-[var(--ink-700)]">
            <li>1. Write what happened in your natural voice.</li>
            <li>2. Save it privately to your journal.</li>
            <li>3. Send it into Copilot for reflection or a polished rewrite.</li>
          </ol>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={onSaveEntry} disabled={!isAuthenticated || isSavingEntry}>
            {isSavingEntry ? "Saving..." : "Save privately"}
          </Button>
          <Button variant="secondary" onClick={onReflect}>
            <Sparkles className="mr-2 h-4 w-4" /> Reflect with Copilot
          </Button>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h3 className="text-sm font-semibold tracking-[0.12em] text-[var(--ink-700)] uppercase">
          {isAuthenticated ? "Recent entries" : "Start here"}
        </h3>
        {isAuthenticated ? (
          <div className="mt-3 space-y-3 text-sm text-[var(--ink-800)]">
            {isEntriesLoading ? <p>Loading entries...</p> : null}
            {!isEntriesLoading && entries.length === 0 ? <p>No entries yet. Save your first journal above.</p> : null}
            {entries.slice(0, 5).map((entry) => (
              <div key={entry.id} className="rounded-xl bg-white/80 p-3">
                <p className="text-xs uppercase tracking-[0.1em] text-[var(--ink-500)]">
                  {entry.mood} - {formatDate(entry.created_at)}
                </p>
                <p className="mt-1 font-semibold text-[var(--ink-900)]">{entry.headline}</p>
                <p className="mt-1 line-clamp-2">{entry.body}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 space-y-3 text-sm text-[var(--ink-800)]">
            <div className="rounded-xl bg-white/80 p-4">
              <p className="font-semibold text-[var(--ink-900)]">What makes Journa different</p>
              <p className="mt-1 text-[var(--ink-700)]">
                It is not just a place to store writing. It helps you reflect, remember patterns, and turn rough notes into clear personal narrative.
              </p>
            </div>
            <ul className="space-y-3">
              {dailyPrompts.map((prompt) => (
                <li key={prompt} className="rounded-xl bg-white/80 p-3">
                  {prompt}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </section>
  );
}
