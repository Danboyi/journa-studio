"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

import { lifeCyclePromptPack } from "@/lib/prompt-packs";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(lifeCyclePromptPack.length).fill(""));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const question = lifeCyclePromptPack[step];
  const isLast = step === lifeCyclePromptPack.length - 1;
  const canAdvance = answers[step].trim().length > 0;

  async function handleNext() {
    if (!canAdvance) return;

    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: lifeCyclePromptPack.map((q, i) => ({
            question: q,
            answer: answers[i],
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Failed to save");
      }

      router.replace("/journal");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      setIsSubmitting(false);
    }
  }

  function handleSkip() {
    router.replace("/journal");
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[var(--sand-50)] px-6 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-10 text-center">
          <p className="text-2xl font-bold tracking-tight text-[var(--ink-950)]">journa</p>
          <p className="mt-2 text-sm text-[var(--ink-500)]">
            A few questions to understand your story
          </p>
        </div>

        {/* Progress dots */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {lifeCyclePromptPack.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? "w-6 bg-[var(--ink-950)]"
                  : i < step
                  ? "w-1.5 bg-[var(--ink-400)]"
                  : "w-1.5 bg-[var(--ink-200)]"
              }`}
            />
          ))}
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="rounded-3xl border border-[var(--ink-300)]/30 bg-white/80 p-6 shadow-sm backdrop-blur-sm"
          >
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-400)]">
              {step + 1} of {lifeCyclePromptPack.length}
            </p>
            <p className="mb-5 text-base font-semibold leading-snug text-[var(--ink-950)]">
              {question}
            </p>

            <textarea
              autoFocus
              className="w-full resize-none rounded-2xl border border-[var(--ink-300)]/40 bg-[var(--sand-50)] px-4 py-3 text-sm leading-relaxed text-[var(--ink-900)] placeholder:text-[var(--ink-300)] focus:border-[var(--ink-400)] focus:outline-none"
              placeholder="Take your time..."
              rows={5}
              value={answers[step]}
              onChange={(e) => {
                const next = [...answers];
                next[step] = e.target.value;
                setAnswers(next);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && canAdvance) {
                  void handleNext();
                }
              }}
            />

            {error && (
              <p className="mt-3 text-xs text-red-600">{error}</p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-sm text-[var(--ink-400)] transition-colors hover:text-[var(--ink-600)]"
          >
            Skip for now
          </button>

          <button
            onClick={() => void handleNext()}
            disabled={!canAdvance || isSubmitting}
            className="flex items-center gap-2 rounded-full bg-[var(--ink-950)] px-5 py-2.5 text-sm font-medium text-white transition-all active:scale-95 disabled:opacity-40"
          >
            {isSubmitting ? (
              "Saving..."
            ) : isLast ? (
              <><Check className="h-4 w-4" /> Done</>
            ) : (
              <>Next <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--ink-300)]">
          ⌘↵ to continue · answers are private
        </p>
      </div>
    </div>
  );
}
