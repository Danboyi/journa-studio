import { notFound } from "next/navigation";

import { getPublicShareByToken } from "@/lib/shares";

export default async function SharedCompositionPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await getPublicShareByToken(token);

  if ("error" in result || !result.data.composition) {
    notFound();
  }

  const composition = result.data.composition;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <article className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-500)]">Shared via My Journa</p>
        <h1 className="mt-3 text-4xl font-semibold text-[var(--ink-950)]">{composition.title}</h1>
        <p className="mt-3 text-sm text-[var(--ink-700)]">{composition.excerpt}</p>
        <pre className="mt-6 whitespace-pre-wrap rounded-2xl bg-[var(--sand-50)] p-4 text-sm leading-relaxed text-[var(--ink-900)]">
          {composition.draft}
        </pre>
      </article>
    </main>
  );
}