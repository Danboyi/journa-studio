"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Library, Share2, Download, Plus, ExternalLink } from "lucide-react";

import { useCompose } from "@/hooks/use-compose";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
}

type Tab = "compositions" | "collections";

export default function LibraryPage() {
  const [tab, setTab] = useState<Tab>("compositions");
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
            className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700"
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
            <div className="space-y-3">
              {compose.compositions.map((comp) => {
                const existingShare = compose.findLatestShare(comp.id);
                return (
                  <motion.div
                    key={comp.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-[var(--ink-300)]/30 bg-white/60 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--ink-950)] line-clamp-1">{comp.title}</p>
                        <p className="mt-0.5 text-xs capitalize text-[var(--ink-500)]">
                          {comp.mode.replace(/-/g, " ")} · {comp.mood} · {formatDate(comp.created_at)}
                        </p>
                        <p className="mt-1.5 text-sm text-[var(--ink-700)] line-clamp-2">{comp.excerpt}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => void compose.createShareLink(comp.id)}
                        disabled={compose.activeShareId === comp.id}
                        className="flex items-center gap-1 rounded-full border border-[var(--ink-300)] bg-white/70 px-3 py-1 text-xs text-[var(--ink-700)] active:scale-95"
                      >
                        <Share2 className="h-3 w-3" />
                        {existingShare ? "New link" : "Share"}
                      </button>
                      <button
                        onClick={() => void compose.exportComposition(comp.id, "markdown")}
                        disabled={compose.activeExportId === comp.id}
                        className="flex items-center gap-1 rounded-full border border-[var(--ink-300)] bg-white/70 px-3 py-1 text-xs text-[var(--ink-700)] active:scale-95"
                      >
                        <Download className="h-3 w-3" />
                        Export
                      </button>
                      {compose.collections.length > 0 && (
                        <button
                          onClick={() => void compose.addToCollection(comp.id)}
                          disabled={compose.activeCollectionId === comp.id}
                          className="flex items-center gap-1 rounded-full border border-[var(--ink-300)] bg-white/70 px-3 py-1 text-xs text-[var(--ink-700)] active:scale-95"
                        >
                          <Plus className="h-3 w-3" />
                          Add to collection
                        </button>
                      )}
                    </div>

                    {/* Existing share info */}
                    {existingShare && (
                      <div className="mt-2 flex items-center gap-1.5 rounded-xl bg-[var(--sand-50)] px-3 py-2">
                        <span className="text-xs text-[var(--ink-700)]">Active share link</span>
                        <span className="text-xs text-[var(--ink-500)]">· {existingShare.view_count} view(s)</span>
                        <button
                          onClick={() => void compose.revokeShare(existingShare.id)}
                          className="ml-auto text-xs text-red-500"
                        >
                          Revoke
                        </button>
                      </div>
                    )}
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
                  {/* Collection selector for adding items */}
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
