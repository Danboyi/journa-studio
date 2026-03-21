"use client";

import { useState, useCallback } from "react";
import type {
  Collection,
  ComposeJobItem,
  ComposeRequest,
  ComposeResponse,
  CompositionHistoryItem,
  CompositionShareItem,
  NarrativeMood,
} from "@/types/journa";
import type { RetrievalResults } from "@/hooks/use-memory";

const DRAFT_KEY = "journa_compose_draft";

export function useCompose() {
  const [composeInput, setComposeInput] = useState<ComposeRequest>({
    mode: "essay",
    mood: "serious",
    voiceNotes: "I write like I speak: direct, honest, reflective.",
    sourceText: "",
    stylePreset: "balanced",
    persist: true,
  });
  const [result, setResult] = useState<ComposeResponse | null>(null);
  const [relatedMemories, setRelatedMemories] = useState<RetrievalResults | null>(null);
  const [composeStatus, setComposeStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [compositions, setCompositions] = useState<CompositionHistoryItem[]>([]);
  const [composeJobs, setComposeJobs] = useState<ComposeJobItem[]>([]);
  const [shares, setShares] = useState<CompositionShareItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isJobsLoading, setIsJobsLoading] = useState(false);
  const [isSharesLoading, setIsSharesLoading] = useState(false);
  const [isCollectionsLoading, setIsCollectionsLoading] = useState(false);

  const [activeShareId, setActiveShareId] = useState<string | null>(null);
  const [activeExportId, setActiveExportId] = useState<string | null>(null);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState("");
  const [shareExpiryDays, setShareExpiryDays] = useState(30);
  const [sharePassword, setSharePassword] = useState("");

  const moods: NarrativeMood[] = ["funny", "serious", "sad", "sorrowful", "horror", "suspense", "soul-piercing"];

  // Save draft to localStorage so reflect page can pick it up after navigation
  const saveDraft = useCallback((sourceText: string, mood: NarrativeMood, entryId?: string) => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ sourceText, mood, entryId: entryId ?? null }));
    } catch {
      // ignore
    }
  }, []);

  const loadDraft = useCallback((): { sourceText: string; mood: NarrativeMood; entryId: string | null } | null => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      localStorage.removeItem(DRAFT_KEY);
      return JSON.parse(raw) as { sourceText: string; mood: NarrativeMood; entryId: string | null };
    } catch {
      return null;
    }
  }, []);

  async function retrieveRelated(sourceText: string): Promise<RetrievalResults | null> {
    try {
      const res = await fetch(`/api/copilot/retrieve?q=${encodeURIComponent(sourceText.trim())}`);
      const payload = (await res.json()) as {
        entries?: RetrievalResults["entries"];
        compositions?: RetrievalResults["compositions"];
      };
      return { entries: payload.entries ?? [], compositions: payload.compositions ?? [] };
    } catch {
      return null;
    }
  }

  const generateDraft = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setComposeStatus(null);

    try {
      // Try sync compose first (works for unauthenticated too)
      const res = await fetch("/api/copilot/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(composeInput),
      });

      const data = (await res.json()) as ComposeResponse | { error?: string };

      if (!res.ok || ("error" in data && data.error)) {
        // Fall back to async job if sync failed
        await enqueueJob();
        return;
      }

      const response = data as ComposeResponse;
      setResult(response);
      setComposeStatus("Done.");

      if (response.reflection && composeInput.sourceText.trim()) {
        const related = await retrieveRelated(composeInput.sourceText);
        setRelatedMemories(related);
      } else {
        setRelatedMemories(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [composeInput]); // eslint-disable-line react-hooks/exhaustive-deps

  async function enqueueJob() {
    const enqueueRes = await fetch("/api/copilot/compose/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: composeInput.mode,
        mood: composeInput.mood,
        sourceText: composeInput.sourceText,
        voiceNotes: composeInput.voiceNotes,
        stylePreset: composeInput.stylePreset ?? "balanced",
        maxAttempts: 3,
      }),
    });

    const enqueuePayload = (await enqueueRes.json()) as { error?: string; job?: { id: string } };

    if (!enqueueRes.ok || !enqueuePayload.job?.id) {
      setError(enqueuePayload.error ?? "Could not start composition job.");
      return;
    }

    const jobId = enqueuePayload.job.id;
    setComposeStatus("Queued. Writing your draft...");

    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 2000));

      const statusRes = await fetch(`/api/copilot/compose/jobs/${jobId}`);
      const statusPayload = (await statusRes.json()) as {
        job?: { status: string; last_error?: string | null };
        composition?: { title: string; excerpt: string; draft: string; editorial_notes: string[] } | null;
      };

      if (!statusRes.ok || !statusPayload.job) {
        setError("Could not track composition job.");
        return;
      }

      if (statusPayload.job.status === "queued") { setComposeStatus("Waiting for AI..."); continue; }
      if (statusPayload.job.status === "processing") { setComposeStatus("Writing your draft..."); continue; }
      if (statusPayload.job.status === "failed") { setError(statusPayload.job.last_error ?? "Composition failed."); return; }

      if (statusPayload.job.status === "completed" && statusPayload.composition) {
        const nextResult: ComposeResponse = {
          title: statusPayload.composition.title,
          excerpt: statusPayload.composition.excerpt,
          draft: statusPayload.composition.draft,
          editorialNotes: statusPayload.composition.editorial_notes,
        };
        setResult(nextResult);
        setComposeStatus("Draft ready.");

        if (composeInput.sourceText.trim()) {
          const related = await retrieveRelated(composeInput.sourceText);
          setRelatedMemories(related);
        }
        await loadHistory();
        return;
      }
    }

    setError("Taking longer than expected. Check Library soon.");
  }

  const loadHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const res = await fetch("/api/copilot/history");
      const payload = (await res.json()) as { compositions?: CompositionHistoryItem[]; error?: string };
      if (res.ok && payload.compositions) setCompositions(payload.compositions);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  const loadJobs = useCallback(async () => {
    setIsJobsLoading(true);
    try {
      const res = await fetch("/api/copilot/compose/jobs");
      const payload = (await res.json()) as { jobs?: ComposeJobItem[]; error?: string };
      if (res.ok && payload.jobs) setComposeJobs(payload.jobs);
    } finally {
      setIsJobsLoading(false);
    }
  }, []);

  const loadShares = useCallback(async () => {
    setIsSharesLoading(true);
    try {
      const res = await fetch("/api/copilot/shares");
      const payload = (await res.json()) as { shares?: CompositionShareItem[]; error?: string };
      if (res.ok && payload.shares) setShares(payload.shares);
    } finally {
      setIsSharesLoading(false);
    }
  }, []);

  const loadCollections = useCallback(async () => {
    setIsCollectionsLoading(true);
    try {
      const res = await fetch("/api/collections");
      const payload = (await res.json()) as { collections?: Collection[]; error?: string };
      if (res.ok && payload.collections) {
        setCollections(payload.collections);
        if (!selectedCollectionId && payload.collections.length > 0) {
          setSelectedCollectionId(payload.collections[0].id);
        }
      }
    } finally {
      setIsCollectionsLoading(false);
    }
  }, [selectedCollectionId]);

  const loadAll = useCallback(async () => {
    await Promise.all([loadHistory(), loadJobs(), loadShares(), loadCollections()]);
  }, [loadHistory, loadJobs, loadShares, loadCollections]);

  const openHistoryItem = useCallback(async (item: CompositionHistoryItem) => {
    setComposeInput({
      mode: item.mode,
      mood: item.mood,
      stylePreset: item.style_preset ?? "balanced",
      sourceText: item.source_text,
      voiceNotes: item.voice_notes,
      persist: true,
    });
    setResult({
      title: item.title,
      excerpt: item.excerpt,
      draft: item.draft,
      editorialNotes: item.editorial_notes,
      reflection: item.reflection ?? undefined,
    });
    if (item.reflection && item.source_text.trim()) {
      const related = await retrieveRelated(item.source_text);
      setRelatedMemories(related);
    } else {
      setRelatedMemories(null);
    }
  }, []);

  const createShareLink = useCallback(async (compositionId: string) => {
    setActiveShareId(compositionId);
    setShareStatus(null);
    try {
      const res = await fetch("/api/copilot/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          compositionId,
          expiresInDays: shareExpiryDays,
          password: sharePassword.trim() || undefined,
        }),
      });
      const payload = (await res.json()) as { error?: string; share?: { token: string } };
      if (!res.ok || !payload.share?.token) { setError(payload.error ?? "Could not create share link."); return; }
      const link = `${window.location.origin}/share/${payload.share.token}`;
      await navigator.clipboard.writeText(link);
      setShareStatus(`Link copied. Expires in ${shareExpiryDays} day(s).`);
      await loadShares();
    } finally {
      setActiveShareId(null);
    }
  }, [shareExpiryDays, sharePassword, loadShares]);

  const revokeShare = useCallback(async (shareId: string) => {
    try {
      const res = await fetch(`/api/copilot/shares/${shareId}`, { method: "DELETE" });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) { setError(payload.error ?? "Could not revoke share."); return; }
      setShareStatus("Share revoked.");
      await loadShares();
    } catch {
      setError("Could not revoke share.");
    }
  }, [loadShares]);

  const exportComposition = useCallback(async (compositionId: string, format: "markdown" | "text") => {
    setActiveExportId(compositionId);
    try {
      const res = await fetch("/api/copilot/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ compositionId, format }),
      });
      const payload = (await res.json()) as { error?: string; filename?: string; content?: string; mimeType?: string };
      if (!res.ok || !payload.filename || !payload.content || !payload.mimeType) {
        setError(payload.error ?? "Could not export.");
        return;
      }
      const blob = new Blob([payload.content], { type: payload.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = payload.filename;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setActiveExportId(null);
    }
  }, []);

  const createCollection = useCallback(async (title: string, description: string, isPublic: boolean): Promise<boolean> => {
    setActiveCollectionId("create");
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), isPublic }),
      });
      const payload = (await res.json()) as { error?: string; collection?: Collection };
      if (!res.ok || !payload.collection) { setError(payload.error ?? "Could not create collection."); return false; }
      if (payload.collection) setSelectedCollectionId(payload.collection.id);
      await loadCollections();
      return true;
    } finally {
      setActiveCollectionId(null);
    }
  }, [loadCollections]);

  const addToCollection = useCallback(async (compositionId: string): Promise<boolean> => {
    if (!selectedCollectionId) { setError("Select a collection first."); return false; }
    setActiveCollectionId(compositionId);
    try {
      const res = await fetch(`/api/collections/${selectedCollectionId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ compositionId }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) { setError(payload.error ?? "Could not add to collection."); return false; }
      await loadCollections();
      setShareStatus("Added to collection.");
      return true;
    } finally {
      setActiveCollectionId(null);
    }
  }, [selectedCollectionId, loadCollections]);

  const findLatestShare = useCallback((compositionId: string) => {
    return shares.find((s) => s.composition_id === compositionId && !s.is_revoked) ?? null;
  }, [shares]);

  const clearError = useCallback(() => setError(null), []);
  const clearStatus = useCallback(() => setComposeStatus(null), []);

  return {
    composeInput, setComposeInput,
    result, setResult,
    relatedMemories,
    composeStatus, clearStatus,
    isLoading,
    error, clearError,
    moods,
    compositions, composeJobs, shares, collections,
    isHistoryLoading, isJobsLoading, isSharesLoading, isCollectionsLoading,
    activeShareId, activeExportId, activeCollectionId,
    shareStatus, setShareStatus,
    selectedCollectionId, setSelectedCollectionId,
    shareExpiryDays, setShareExpiryDays,
    sharePassword, setSharePassword,
    saveDraft, loadDraft,
    generateDraft,
    loadHistory, loadJobs, loadShares, loadCollections, loadAll,
    openHistoryItem,
    createShareLink, revokeShare, exportComposition,
    createCollection, addToCollection,
    findLatestShare,
  };
}
