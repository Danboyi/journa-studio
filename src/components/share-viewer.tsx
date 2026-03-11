"use client";

import { useEffect, useState } from "react";

type SharePayload = {
  expires_at?: string | null;
  view_count?: number;
  last_viewed_at?: string | null;
  composition: {
    title: string;
    excerpt: string;
    draft: string;
    mood?: string;
    mode?: string;
    created_at?: string;
  };
};

export function ShareViewer({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [share, setShare] = useState<SharePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetch(`/api/public/share/${token}`);
      const payload = (await res.json()) as { share?: SharePayload; error?: string };

      if (!res.ok || !payload.share) {
        setError(payload.error ?? "Unable to load shared story.");
      } else {
        setShare(payload.share);
        setError(null);
      }

      setLoading(false);
    };

    void load();
  }, [token]);

  async function unlock() {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/public/share/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const payload = (await res.json()) as { share?: SharePayload; error?: string };

    if (!res.ok || !payload.share) {
      setError(payload.error ?? "Unable to unlock share.");
      setLoading(false);
      return;
    }

    setShare(payload.share);
    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {!share ? (
        <section className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur">
          <h1 className="text-2xl font-semibold text-[var(--ink-950)]">Shared Story</h1>
          {loading ? <p className="mt-3 text-sm text-[var(--ink-700)]">Loading...</p> : null}
          {error === "Share password required." || error === "Invalid share password." ? (
            <>
              <p className="mt-3 text-sm text-[var(--ink-700)]">This share link is password protected.</p>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-3 h-11 w-full rounded-xl border border-[var(--ink-300)] bg-white/90 px-4 text-sm"
                placeholder="Enter share password"
              />
              <button
                type="button"
                onClick={unlock}
                className="mt-3 rounded-full bg-[var(--brand-700)] px-5 py-2 text-sm font-semibold text-white"
                disabled={loading}
              >
                {loading ? "Unlocking..." : "Unlock"}
              </button>
            </>
          ) : null}
          {error && error !== "Share password required." && error !== "Invalid share password." ? (
            <p className="mt-3 text-sm text-red-700">{error}</p>
          ) : null}
        </section>
      ) : (
        <article className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-500)]">Shared via Journa</p>
          <h1 className="mt-3 text-4xl font-semibold text-[var(--ink-950)]">{share.composition.title}</h1>
          <p className="mt-3 text-sm text-[var(--ink-700)]">{share.composition.excerpt}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--ink-600)]">
            {share.composition.mode ? <span className="rounded-full bg-[var(--sand-50)] px-3 py-1">{share.composition.mode}</span> : null}
            {share.composition.mood ? <span className="rounded-full bg-[var(--sand-50)] px-3 py-1">{share.composition.mood}</span> : null}
            {typeof share.view_count === "number" ? <span className="rounded-full bg-[var(--sand-50)] px-3 py-1">{share.view_count} views</span> : null}
          </div>
          <pre className="mt-6 whitespace-pre-wrap rounded-2xl bg-[var(--sand-50)] p-4 text-sm leading-relaxed text-[var(--ink-900)]">
            {share.composition.draft}
          </pre>
          <p className="mt-5 text-xs text-[var(--ink-500)]">
            This piece was intentionally shared from a private Journa workspace.
          </p>
        </article>
      )}
    </main>
  );
}
