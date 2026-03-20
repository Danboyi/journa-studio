"use client";

import { useState } from "react";
import { LogOut, Shield, Sparkles, Brain, BookOpen, ExternalLink } from "lucide-react";

import { useSession } from "@/context/session-context";

export default function SettingsPage() {
  const { user, signOut } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    await signOut();
  }

  return (
    <div className="page-container">
      {/* User section */}
      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-[var(--ink-300)]/30 bg-white/60 p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ink-950)] text-lg font-bold text-white">
          {user.email?.[0]?.toUpperCase() ?? "J"}
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--ink-950)]">{user.email ?? "Your account"}</p>
          <p className="text-xs text-[var(--ink-500)]">Private journaling account</p>
        </div>
      </div>

      {/* About section */}
      <div className="mb-6 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">About journa</p>

        {[
          {
            icon: BookOpen,
            title: "Write daily",
            desc: "Capture what happened in a sentence or a page. No judgment, no audience.",
          },
          {
            icon: Sparkles,
            title: "Reflect with AI",
            desc: "The AI doesn't write for you — it helps you see what you already wrote more clearly.",
          },
          {
            icon: Brain,
            title: "Memory over time",
            desc: "Your writing builds a searchable, pattern-aware memory you can return to.",
          },
          {
            icon: Shield,
            title: "Private by default",
            desc: "Everything stays in your account. Sharing is always opt-in and explicit.",
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex gap-3 rounded-2xl border border-[var(--ink-300)]/30 bg-white/60 p-4">
            <div className="mt-0.5 shrink-0 rounded-xl bg-[var(--sand-50)] p-2">
              <Icon className="h-4 w-4 text-[var(--ink-700)]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--ink-900)]">{title}</p>
              <p className="mt-0.5 text-xs text-[var(--ink-600)]">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Links */}
      <div className="mb-6 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">Links</p>
        <a
          href="/library"
          className="flex items-center justify-between rounded-2xl border border-[var(--ink-300)]/30 bg-white/60 px-4 py-3 text-sm text-[var(--ink-800)]"
        >
          Public collections <ExternalLink className="h-3.5 w-3.5 text-[var(--ink-400)]" />
        </a>
      </div>

      {/* Sign out */}
      <button
        onClick={() => void handleSignOut()}
        disabled={isSigningOut}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-3.5 text-sm font-medium text-red-600 transition-all active:scale-[0.98] disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" />
        {isSigningOut ? "Signing out..." : "Sign out"}
      </button>

      <p className="mt-6 text-center text-xs text-[var(--ink-300)]">
        journa · private memory studio
      </p>
    </div>
  );
}
