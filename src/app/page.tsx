"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Lock, Sparkles, Brain, Eye, EyeOff, AlertTriangle, Terminal } from "lucide-react";

type AuthMode = "sign-up" | "sign-in";

type SetupStatus = {
  supabase: boolean;
  openai: boolean;
};

const features = [
  { icon: Lock, label: "Private by default" },
  { icon: Sparkles, label: "AI that reflects, not rewrites" },
  { icon: Brain, label: "Memory that compounds" },
];

function SetupBanner({ setup }: { setup: SetupStatus }) {
  const missing: string[] = [];
  if (!setup.supabase) missing.push("Supabase (auth + database)");
  if (!setup.openai) missing.push("OpenAI (optional — AI compose)");

  if (setup.supabase) return null; // Only block on Supabase — OpenAI has a demo fallback

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto mb-6 max-w-sm rounded-2xl border border-amber-200 bg-amber-50 p-4"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div>
          <p className="text-sm font-semibold text-amber-900">Setup required</p>
          <p className="mt-1 text-xs text-amber-800">
            {missing[0]} is not configured. Add your credentials to{" "}
            <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-amber-900">.env.local</code>{" "}
            to enable sign up and login.
          </p>
          <details className="mt-3">
            <summary className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-amber-800">
              <Terminal className="h-3 w-3" />
              View setup instructions
            </summary>
            <div className="mt-2 rounded-xl bg-amber-100 p-3 font-mono text-xs text-amber-900 leading-relaxed">
              <p className="font-semibold"># 1. Create Supabase project at supabase.com</p>
              <p className="mt-2 font-semibold"># 2. Copy .env.example → .env.local</p>
              <p className="mt-1">cp .env.example .env.local</p>
              <p className="mt-2 font-semibold"># 3. Fill in your Supabase credentials:</p>
              <p>NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co</p>
              <p>NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key</p>
              <p>SUPABASE_SERVICE_ROLE_KEY=your-service-role-key</p>
              <p className="mt-2 font-semibold"># 4. Run migrations</p>
              <p>supabase db push</p>
              <p className="mt-2 font-semibold"># 5. Restart dev server</p>
              <p>npm run dev</p>
            </div>
          </details>
        </div>
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<AuthMode>("sign-up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const authRef = useRef<HTMLDivElement>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [setup, setSetup] = useState<SetupStatus | null>(null);

  // Check setup status + redirect if already authenticated
  useEffect(() => {
    // Run both in parallel
    Promise.all([
      fetch("/api/health")
        .then((r) => r.json())
        .then((p: { providers?: { supabase?: boolean; openai?: boolean } }) => {
          setSetup({
            supabase: p.providers?.supabase ?? false,
            openai: p.providers?.openai ?? false,
          });
        })
        .catch(() => setSetup({ supabase: false, openai: false })),
      fetch("/api/auth/session")
        .then((r) => r.json())
        .then((p: { user?: { id: string } }) => {
          if (p.user) router.replace("/journal");
        })
        .catch(() => {}),
    ]).finally(() => setIsCheckingSession(false));
  }, [router]);

  function openAuth(mode: AuthMode) {
    setAuthMode(mode);
    setShowAuth(true);
    setTimeout(() => authRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const endpoint = authMode === "sign-in" ? "/api/auth/sign-in" : "/api/auth/sign-up";
      const body = authMode === "sign-up"
        ? { email, password, fullName: fullName || undefined }
        : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload = (await res.json()) as {
        error?: string;
        user?: { id: string };
        needsEmailConfirmation?: boolean;
      };

      if (!res.ok || payload.error) {
        const msg = payload.error ?? "Authentication failed.";
        // Give a clearer message for the Supabase not configured case
        setError(
          msg === "Supabase is not configured."
            ? "Database not configured. Add Supabase credentials to .env.local and restart the server."
            : msg
        );
        return;
      }

      if (payload.needsEmailConfirmation) {
        setError("Account created — check your email to confirm, then sign in.");
        setAuthMode("sign-in");
        return;
      }

      if (payload.user) {
        router.push("/journal");
        return;
      }

      // Verify session
      const sessionRes = await fetch("/api/auth/session");
      const sessionPayload = (await sessionRes.json()) as { user?: { id: string } };
      if (sessionPayload.user) {
        router.push("/journal");
      } else {
        setError("Something went wrong. Please try signing in.");
        setAuthMode("sign-in");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isCheckingSession) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--ink-300)] border-t-[var(--ink-950)]" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] overflow-x-hidden">
      {/* Setup banner — shown when Supabase not configured */}
      {setup && !setup.supabase && (
        <div className="px-6 pt-6 sm:px-8">
          <SetupBanner setup={setup} />
        </div>
      )}

      {/* Hero — fills first screen */}
      <section className="flex min-h-[100dvh] flex-col px-6 pb-8 sm:px-8">
        {/* Top wordmark */}
        <div className="pt-10">
          <span className="font-display text-base font-semibold tracking-tight text-[var(--ink-950)]">journa</span>
        </div>

        {/* Main content — centered vertically */}
        <div className="flex flex-1 flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--ink-500)]">
              Private memory studio
            </p>
            <h1 className="mt-3 max-w-sm font-display text-[2.75rem] leading-[1.1] font-semibold tracking-tight text-[var(--ink-950)] sm:text-6xl">
              A journal that helps you understand your life.
            </h1>
            <p className="mt-4 max-w-sm text-base leading-relaxed text-[var(--ink-700)]">
              Capture what happened. Reflect on what it meant.
              Notice what keeps coming back.
            </p>

            {/* Feature pills */}
            <div className="mt-6 flex flex-wrap gap-2">
              {features.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="flex items-center gap-1.5 rounded-full border border-[var(--ink-300)]/50 bg-white/60 px-3 py-1.5 text-xs font-medium text-[var(--ink-700)] backdrop-blur-sm"
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
            className="mt-10 flex flex-col gap-3 sm:flex-row"
          >
            <button
              onClick={() => setup?.supabase !== false && openAuth("sign-up")}
              disabled={setup?.supabase === false}
              title={setup?.supabase === false ? "Configure Supabase in .env.local first" : undefined}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[var(--ink-950)] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-40 sm:flex-1"
            >
              Start writing <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setup?.supabase !== false && openAuth("sign-in")}
              disabled={setup?.supabase === false}
              title={setup?.supabase === false ? "Configure Supabase in .env.local first" : undefined}
              className="flex items-center justify-center rounded-2xl border border-[var(--ink-300)] bg-white/70 px-6 py-3.5 text-sm font-medium text-[var(--ink-800)] backdrop-blur-sm transition-all active:scale-[0.98] disabled:opacity-40 sm:flex-1"
            >
              Sign in
            </button>
          </motion.div>
        </div>
      </section>

      {/* Auth section */}
      <AnimatePresence>
        {showAuth && (
          <motion.section
            ref={authRef}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.3 }}
            className="px-6 pb-16 sm:px-8"
          >
            <div className="mx-auto max-w-sm">
              {/* Mode toggle */}
              <div className="mb-6 flex gap-1 rounded-2xl border border-[var(--ink-300)]/50 bg-white/60 p-1 backdrop-blur-sm">
                {(["sign-up", "sign-in"] as AuthMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => { setAuthMode(mode); setError(null); }}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all ${
                      authMode === mode
                        ? "bg-[var(--ink-950)] text-white shadow-sm"
                        : "text-[var(--ink-600)]"
                    }`}
                  >
                    {mode === "sign-up" ? "Create account" : "Sign in"}
                  </button>
                ))}
              </div>

              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
                <AnimatePresence>
                  {authMode === "sign-up" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <input
                        className="w-full rounded-2xl border border-[var(--ink-300)] bg-white/80 px-4 py-3.5 text-sm text-[var(--ink-900)] placeholder:text-[var(--ink-300)] focus:border-[var(--ink-700)] focus:outline-none"
                        placeholder="Full name (optional)"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        autoComplete="name"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <input
                  className="w-full rounded-2xl border border-[var(--ink-300)] bg-white/80 px-4 py-3.5 text-sm text-[var(--ink-900)] placeholder:text-[var(--ink-300)] focus:border-[var(--ink-700)] focus:outline-none"
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />

                <div className="relative">
                  <input
                    className="w-full rounded-2xl border border-[var(--ink-300)] bg-white/80 px-4 py-3.5 pr-12 text-sm text-[var(--ink-900)] placeholder:text-[var(--ink-300)] focus:border-[var(--ink-700)] focus:outline-none"
                    placeholder="Password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={authMode === "sign-up" ? "new-password" : "current-password"}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--ink-400)]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={isLoading || !email || !password}
                  className="w-full rounded-2xl bg-[var(--ink-950)] py-3.5 text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isLoading
                    ? "Please wait..."
                    : authMode === "sign-up"
                    ? "Create my journal"
                    : "Sign in"}
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-[var(--ink-500)]">
                Secure HTTP-only session cookies. No third-party tracking.
              </p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Feature details */}
      <section className="px-6 pb-16 pt-4 sm:px-8">
        <div className="mx-auto max-w-sm space-y-8">
          {[
            {
              emoji: "✍️",
              title: "Write first. Polish later.",
              body: "Start with the raw moment. The AI helps you see what you actually wrote — not what it thinks you should have said.",
            },
            {
              emoji: "🪞",
              title: "Reflection before rewriting.",
              body: "Before any AI edit, you get a breakdown: what happened, what mattered, what sits beneath the surface.",
            },
            {
              emoji: "🧠",
              title: "Your writing compounds.",
              body: "Over time, Journa surfaces patterns — moods, themes, recurring moments. Your life becomes searchable.",
            },
            {
              emoji: "🔒",
              title: "Private is the default.",
              body: "Nothing is public unless you choose. Sharing is always explicit, optional, and revocable.",
            },
          ].map(({ emoji, title, body }) => (
            <div key={title} className="flex gap-4">
              <span className="mt-0.5 text-2xl">{emoji}</span>
              <div>
                <p className="text-sm font-semibold text-[var(--ink-950)]">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--ink-700)]">{body}</p>
              </div>
            </div>
          ))}

          <button
            onClick={() => openAuth("sign-up")}
            className="w-full rounded-2xl bg-[var(--ink-950)] py-3.5 text-sm font-semibold text-white transition-all active:scale-[0.98]"
          >
            Start writing — it&apos;s free
          </button>
        </div>
      </section>
    </div>
  );
}
