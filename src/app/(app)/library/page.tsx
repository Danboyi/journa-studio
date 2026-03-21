"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Download,
  Eye,
  ExternalLink,
  Footprints,
  HelpCircle,
  Library,
  Lightbulb,
  Plus,
  Share2,
} from "lucide-react";

import { useCompose } from "@/hooks/use-compose";
import type { CompositionHistoryItem, ReflectionPayload } from "@/types/journa";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long", day: "numeric", year: "numeric",
  }).format(new Date(value));
}

const modeLabel: Record<string, string> = {
  "daily-journal": "Daily journal",
  story: "Story",
  essay: "Essay",
  "statement-of-purpose": "Statement of purpose",
  biography: "Biography",
  autobiography: "Autobiography",
  "life-documentation": "Life documentation",
};

/* ── Composition detail view ───────────────────────────────── */

function CompositionDetail({
  comp,
  onBack,
  compose,
}: {
  comp: CompositionHistoryItem;
  onBack: () => void;
  compose: ReturnType<typeof useCompose>;
}) {
  const existingShare = compose.findLatestShare(comp.id);
  const r = comp.reflection as ReflectionPayload | null;

  const breakdown = r
    ? [
        { icon: Eye,        label: "What happened",          content: r.summary,              accent: "border-[var(--ink-300)]/40 bg-white/70" },
        { icon: Footprints, label: "What mattered",          content: r.whatMattered,          accent: "border-[var(--gravity-200)] bg-[var(--gravity-50)]" },
        { icon: Lightbulb,  label: "Beneath the surface",    content: r.beneathTheSurface,     accent: "border-[var(--brand-300)]/30 bg-[var(--brand-300)]/5" },
        { icon: HelpCircle, label: "The question underneath",content: r.followUpQuestion,      accent: "border-[var(--ink-300)]/40 bg-[var(--sand-50)]" },
      ]
    : [];

  return (
    <motion.div
      key="detail"
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.18 }}
    >
      {/* Back */}
      <button
        onClick={onBack}
        className="mb-5 flex items-center gap-2 text-sm text-[var(--ink-500)] transition-colors hover:text-[var(--ink-900)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Library
      </button>

      {/* Title + meta */}
      <div className="mb-5">
        <div className="mb-2 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-[var(--sand-100)] px-2.5 py-1 text-[11px] font-medium capitalize text-[var(--ink-600)]">
            {modeLabel[comp.mode] ?? comp.mode}
          </span>
          <span className="rounded-full bg-[var(--sand-100)] px-2.5 py-1 text-[11px] font-medium capitalize text-[var(--ink-600)]">
            {comp.mood}
          </span>
          {comp.style_preset && (
            <span className="rounded-full bg-[var(--sand-100)] px-2.5 py-1 text-[11px] font-medium capitalize text-[var(--ink-600)]">
              {comp.style_preset}
            </span>
          )}
          <span className="rounded-full bg-[var(--sand-100)] px-2.5 py-1 text-[11px] text-[var(--ink-500)]">
            {formatDate(comp.created_at)}
          </span>
        </div>
        <h1 className="font-display text-2xl font-semibold leading-tight text-[var(--ink-950)]">
          {comp.title}
        </h1>
        <p className="mt-2 text-[15px] italic leading-relaxed text-[var(--ink-600)]">
          {comp.excerpt}
        </p>
      </div>

      {/* Reflection breakdown */}
      {breakdown.length > 0 && (
        <div className="mb-5 space-y-2.5">
          <p className="section-label">The breakdown</p>
          {breakdown.map(({ icon: Icon, label, content, accent }) => (
            <div key={label} className={`rounded-2xl border p-4 ${accent}`}>
              <div className="mb-1.5 flex items-center gap-2">
                <Icon className="h-3.5 w-3.5 text-[var(--ink-500)]" strokeWidth={1.8} />
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--ink-500)]">
                  {label}
                </p>
              </div>
              <p className="text-sm leading-relaxed text-[var(--ink-800)]">{content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Polished draft */}
      <div className="mb-5">
        <p className="section-label mb-2">{r ? "Polished" : "Draft"}</p>
        <div className="rounded-2xl border border-[var(--ink-300)]/35 bg-white/70 p-5 text-sm leading-[1.8] text-[var(--ink-900)] whitespace-pre-wrap">
          {comp.draft}
        </div>
      </div>

      {/* Editorial notes — writer-only */}
      {comp.editorial_notes.length > 0 && (
        <div className="mb-6 rounded-2xl bg-[var(--sand-50)] p-4">
          <p className="section-label mb-2.5">What the AI changed</p>
          <ul className="space-y-2">
            {comp.editorial_notes.map((note) => (
              <li key={note} className="flex items-start gap-2.5 text-sm text-[var(--ink-700)]">
                <span className="mt-0.5 shrink-0 text-[var(--ink-300)]">—</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2.5">
        <button
          onClick={() => void compose.createShareLink(comp.id)}
          disabled={compose.activeShareId === comp.id}
          className="flex items-center gap-1.5 rounded-full border border-[var(--ink-300)] bg-white/70 px-4 py-2 text-sm font-medium text-[var(--ink-700)] transition-all active:scale-95 disabled:opacity-40"
        >
          <Share2 className="h-3.5 w-3.5" />
          {existingShare ? "New share link" : "Share"}
        </button>
        <button
          onClick={() => void compose.exportComposition(comp.id, "markdown")}
          disabled={compose.activeExportId === comp.id}
          className="flex items-center gap-1.5 rounded-full border border-[var(--ink-300)] bg-white/70 px-4 py-2 text-sm font-medium text-[var(--ink-700)] transition-all active:scale-95 disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </button>
        {compose.collections.length > 0 && (
          <button
            onClick={() => void compose.addToCollection(comp.id)}
            disabled={compose.activeCollectionId === comp.id}
            className="flex items-center gap-1.5 rounded-full border border-[var(--ink-300)] bg-white/70 px-4 py-2 text-sm font-medium text-[var(--ink-700)] transition-all active:scale-95 disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
            Add to collection
          </button>
        )}
      </div>

      {/* Active share status */}
      {existingShare && (
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-[var(--sand-50)] px-4 py-3">
          <span className="text-sm text-[var(--ink-700)]">Active share link</span>
          <span className="text-sm text-[var(--ink-500)]">· {existingShare.view_count} view(s)</span>
          <button
            onClick={() => void compose.revokeShare(existingShare.id)}
            className="ml-auto text-sm text-red-500 transition-colors hover:text-red-700"
          >
            Revoke
          </button>
        </div>
      )}

      {/* Share / error status */}
      <AnimatePresence>
        {compose.shareStatus && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 text-sm text-[var(--ink-600)]"
          >
            {compose.shareStatus}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Library page ──────────────────────────────────────────── */

type Tab = "compositions" | "collections";

export default function LibraryPage() {
  const [tab, setTab] = useState<Tab>("compositions");
  const [selected, setSelected] = useState<CompositionHistoryItem | null>(null);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newCollectionTitle, setNewCollectionTitle] = useState("");
  const [newCollectionDesc, setNewCollectionDesc] = useState("");
  const [newCollectionPublic, setNewCollectionPublic] = useState(true);

  const compose = useCompose();
  const { loadAll } = compose;

  useEffect(() => { void loadAll(); }, [loadAll]);

  async function handleCreateCollection() {
    if (!newCollectionTitle.trim()) return;
    const ok = await compose.createCollection(newCollectionTitle, newCollectionDesc, newCollectionPublic);
    if (ok) {
      setNewCollectionTitle("");
      setNewCollectionDesc("");
      setShowNewCollection(false);
    }
  }

  // If a composition is open, render the detail view
  if (selected) {
    return (
      <div className="page-container">
        <AnimatePresence mode="wait">
          <CompositionDetail
            key={selected.id}
            comp={selected}
            onBack={() => setSelected(null)}
            compose={compose}
          />
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Tab switcher */}
      <div className="mb-5 flex gap-2">
        {(["compositions", "collections"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors capitalize ${
              tab === t
                ? "bg-[var(--ink-950)] text-white"
                : "border border-[var(--ink-300)] bg-white/60 text-[var(--ink-700)]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Status message */}
      <AnimatePresence>
        {compose.shareStatus && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 rounded-2xl bg-[var(--sand-50)] px-4 py-3 text-sm text-[var(--ink-800)]"
          >
            {compose.shareStatus}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {compose.error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-4 cursor-pointer rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700"
            onClick={compose.clearError}
          >
            {compose.error}
          </motion.div>
        )}
      </AnimatePresence>

      {tab === "compositions" && (
        <div>
          {compose.isHistoryLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-[var(--ink-300)]/20" />
              ))}
            </div>
          ) : compose.compositions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Library className="h-10 w-10 text-[var(--ink-300)]" />
              <p className="text-sm text-[var(--ink-500)]">No compositions yet. Use Reflect to create your first.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {compose.compositions.map((comp, i) => {
                const existingShare = compose.findLatestShare(comp.id);
                return (
                  <motion.div
                    key={comp.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setSelected(comp)}
                    className="card card-hover cursor-pointer p-4 transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[var(--ink-950)] line-clamp-1">
                          {comp.title}
                        </p>
                        <p className="mt-0.5 text-[12px] capitalize text-[var(--ink-500)]">
                          {modeLabel[comp.mode] ?? comp.mode} · {comp.mood} · {formatDate(comp.created_at)}
                        </p>
                        <p className="mt-1.5 text-[13px] leading-snug text-[var(--ink-700)] line-clamp-2">
                          {comp.excerpt}
                        </p>
                      </div>
                      <div className="shrink-0 pt-0.5 text-right">
                        {existingShare && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-300)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--brand-700)]">
                            Shared
                          </span>
                        )}
                        {comp.reflection && (
                          <span className="mt-1 block text-[11px] text-[var(--ink-400)]">
                            Reflection
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "collections" && (
        <div>
          {/* New collection form */}
          <button
            onClick={() => setShowNewCollection(!showNewCollection)}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--ink-300)] py-3 text-sm text-[var(--ink-500)] transition-colors hover:border-[var(--ink-700)] hover:text-[var(--ink-700)]"
          >
            <Plus className="h-4 w-4" />
            New collection
          </button>

          <AnimatePresence>
            {showNewCollection && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden"
              >
                <div className="space-y-3 rounded-2xl border border-[var(--ink-300)] bg-white/60 p-4">
                  <input
                    className="w-full rounded-xl border border-[var(--ink-300)] bg-white/70 px-3 py-2 text-sm focus:outline-none"
                    placeholder="Collection title"
                    value={newCollectionTitle}
                    onChange={(e) => setNewCollectionTitle(e.target.value)}
                  />
                  <input
                    className="w-full rounded-xl border border-[var(--ink-300)] bg-white/70 px-3 py-2 text-sm focus:outline-none"
                    placeholder="Description (optional)"
                    value={newCollectionDesc}
                    onChange={(e) => setNewCollectionDesc(e.target.value)}
                  />
                  <label className="flex items-center gap-2 text-sm text-[var(--ink-700)]">
                    <input
                      type="checkbox"
                      checked={newCollectionPublic}
                      onChange={(e) => setNewCollectionPublic(e.target.checked)}
                      className="rounded"
                    />
                    Make public
                  </label>
                  <button
                    onClick={() => void handleCreateCollection()}
                    disabled={!newCollectionTitle.trim() || compose.activeCollectionId === "create"}
                    className="w-full rounded-xl bg-[var(--ink-950)] py-2 text-sm font-medium text-white disabled:opacity-40"
                  >
                    Create collection
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {compose.isCollectionsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-[var(--ink-300)]/20" />
              ))}
            </div>
          ) : compose.collections.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Library className="h-10 w-10 text-[var(--ink-300)]" />
              <p className="text-sm text-[var(--ink-500)]">No collections yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {compose.collections.map((col) => (
                <motion.div
                  key={col.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-[var(--ink-300)]/30 bg-white/60 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[var(--ink-950)]">{col.title}</p>
                      {col.description && (
                        <p className="mt-0.5 text-xs text-[var(--ink-500)]">{col.description}</p>
                      )}
                      <p className="mt-1 text-xs text-[var(--ink-500)]">
                        {col.is_public ? "Public" : "Private"} · {col.items?.length ?? 0} pieces
                      </p>
                    </div>
                    {col.is_public && (
                      <a
                        href={`/collections/${col.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-[var(--ink-300)] p-1.5 text-[var(--ink-500)]"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => compose.setSelectedCollectionId(col.id)}
                    className={`mt-3 w-full rounded-xl py-1.5 text-xs font-medium transition-colors ${
                      compose.selectedCollectionId === col.id
                        ? "bg-[var(--ink-950)] text-white"
                        : "border border-[var(--ink-300)] text-[var(--ink-700)]"
                    }`}
                  >
                    {compose.selectedCollectionId === col.id ? "Selected for adding" : "Select"}
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
