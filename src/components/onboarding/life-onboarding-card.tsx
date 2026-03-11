"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface LifeOnboardingProps {
  enabled: boolean;
  onBuildNarrative: (input: { sourceText: string; voiceNotes: string }) => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

export function LifeOnboardingCard({ enabled, onBuildNarrative }: LifeOnboardingProps) {
  const [questions, setQuestions] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/onboarding/questions");
        const payload = (await res.json()) as { questions?: string[]; error?: string };

        if (!res.ok || !payload.questions) {
          setError(payload.error ?? "Could not load onboarding questions.");
          return;
        }

        setQuestions(payload.questions);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [enabled]);

  const progress = useMemo(() => {
    if (questions.length === 0) {
      return 0;
    }

    const answered = Object.values(answers).filter((value) => value.trim().length > 0).length;
    return Math.round((answered / questions.length) * 100);
  }, [answers, questions.length]);

  const activeQuestion = questions[step] ?? "";

  function setActiveAnswer(value: string) {
    setAnswers((prev) => ({ ...prev, [step]: value }));
  }

  async function completeOnboarding() {
    const payload = questions.map((question, index) => ({
      question,
      answer: (answers[index] ?? "").trim(),
    }));

    if (payload.some((item) => !item.answer)) {
      setError("Please answer all questions before completing onboarding.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const saveRes = await fetch("/api/onboarding/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload }),
      });

      if (!saveRes.ok) {
        const data = (await saveRes.json()) as { error?: string };
        setError(data.error ?? "Could not save onboarding profile.");
        return;
      }

      const sourceText = payload
        .map((item, index) => `Q${index + 1}: ${item.question}\nA${index + 1}: ${item.answer}`)
        .join("\n\n");

      const voiceNotes =
        "Preserve my natural rhythm and phrasing from these life-cycle responses. Keep it emotionally precise, human, and grounded.";

      onBuildNarrative({ sourceText, voiceNotes });
      setCompleted(true);
    } finally {
      setSaving(false);
    }
  }

  if (!enabled) {
    return null;
  }

  return (
    <Card className="mt-8 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-[var(--ink-900)]">Life-Cycle Onboarding</h2>
        <span className="rounded-full bg-[var(--sand-100)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-700)]">
          {progress}% complete
        </span>
      </div>

      <p className="mt-2 text-sm text-[var(--ink-700)]">
        Answer these once. Journa will use them to understand your deeper context, reflect more intelligently, and build stronger long-form narratives when you want them.
      </p>

      <div className="mt-4 h-2 w-full rounded-full bg-white/70">
        <div
          className="h-2 rounded-full bg-[var(--brand-700)] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {loading ? <p className="mt-4 text-sm text-[var(--ink-700)]">Loading questions...</p> : null}

      {!loading && questions.length > 0 ? (
        <>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">
            Question {step + 1} of {questions.length}
          </p>
          <p className="mt-2 text-base font-medium text-[var(--ink-900)]">{activeQuestion}</p>
          <Textarea
            className="mt-3 min-h-[140px]"
            value={answers[step] ?? ""}
            onChange={(event) => setActiveAnswer(event.target.value)}
            placeholder="Write this in your natural language."
          />

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setStep((value) => clamp(value - 1, 0, questions.length - 1))}
              disabled={step === 0}
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setStep((value) => clamp(value + 1, 0, questions.length - 1))}
              disabled={step === questions.length - 1}
            >
              Next <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <Button size="sm" onClick={completeOnboarding} disabled={saving}>
              <CheckCircle2 className="mr-1 h-4 w-4" />
              {saving ? "Saving..." : "Save and build Copilot narrative"}
            </Button>
          </div>
        </>
      ) : null}

      {completed ? (
        <p className="mt-4 text-sm text-emerald-700">
          Onboarding complete. Your life-cycle answers are now loaded into Copilot.
        </p>
      ) : null}

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
    </Card>
  );
}
