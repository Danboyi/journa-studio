import { notFound } from "next/navigation";

import { getPublicCollectionBySlug } from "@/lib/collections";

export default async function PublicCollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getPublicCollectionBySlug(slug);

  if ("error" in result) {
    notFound();
  }

  const collection = result.data;

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <section className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-500)]">Published Collection</p>
        <h1 className="mt-2 text-4xl font-semibold text-[var(--ink-950)]">{collection.title}</h1>
        {collection.description ? (
          <p className="mt-3 text-sm text-[var(--ink-700)]">{collection.description}</p>
        ) : null}
      </section>

      <section className="mt-6 space-y-4">
        {collection.items.map((item, index) => (
          <article
            key={item.id}
            className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur"
          >
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--ink-500)]">
              Piece {index + 1}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--ink-950)]">
              {item.composition?.title}
            </h2>
            <p className="mt-2 text-sm text-[var(--ink-700)]">{item.composition?.excerpt}</p>
            <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-[var(--sand-50)] p-4 text-sm leading-relaxed text-[var(--ink-900)]">
              {item.composition?.draft}
            </pre>
          </article>
        ))}
      </section>
    </main>
  );
}
