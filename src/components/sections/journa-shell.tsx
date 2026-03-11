"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpenText, WandSparkles } from "lucide-react";
import { motion } from "framer-motion";

import { LifeOnboardingCard } from "@/components/onboarding/life-onboarding-card";
import { AuthCard } from "@/components/sections/auth-card";
import { CopilotPanel } from "@/components/sections/copilot-panel";
import { JournaHero } from "@/components/sections/journa-hero";
import { JournalPanel } from "@/components/sections/journal-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { dailyPromptPack, lifeCyclePromptPack } from "@/lib/prompt-packs";
import type {
  Collection,
  ComposeJobItem,
  CompositionHistoryItem,
  CompositionShareItem,
  ComposeRequest,
  ComposeResponse,
  JournalEntry,
  NarrativeMood,
  StylePreset,
  WritingMode,
} from "@/types/journa";

type AuthMode = "sign-in" | "sign-up";

type SessionUser = {
  id: string;
  email?: string;
};

type ComposeJobStatus = "queued" | "processing" | "completed" | "failed";

const moods: NarrativeMood[] = [
  "funny",
  "serious",
  "sad",
  "sorrowful",
  "horror",
  "suspense",
  "soul-piercing",
];

const writingModes: WritingMode[] = [
  "story",
  "essay",
  "statement-of-purpose",
  "biography",
  "autobiography",
  "life-documentation",
  "daily-journal",
];

const stylePresets: StylePreset[] = [
  "balanced",
  "cinematic",
  "academic",
  "minimalist",
  "soulful",
];

const copilotTemplates: Array<{
  id: string;
  label: string;
  description?: string;
  mode: WritingMode;
  stylePreset: StylePreset;
  mood: NarrativeMood;
}> = [
  {
    id: "reflect",
    label: "Reflect on this",
    description: "Clarify what the note means and what feeling sits underneath it.",
    mode: "essay",
    stylePreset: "balanced",
    mood: "serious",
  },
  {
    id: "story",
    label: "Turn this into a story",
    description: "Shape the raw material into a more narrative and vivid piece.",
    mode: "story",
    stylePreset: "cinematic",
    mood: "serious",
  },
  {
    id: "life",
    label: "Shape a life narrative",
    description: "Connect the moment to identity, memory, and longer personal themes.",
    mode: "autobiography",
    stylePreset: "soulful",
    mood: "serious",
  },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function JournaShell() {
  const [mode, setMode] = useState<"journal" | "copilot">("journal");
  const [authMode, setAuthMode] = useState<AuthMode>("sign-in");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authFullName, setAuthFullName] = useState("");
  const [authUser, setAuthUser] = useState<SessionUser | null>(null);

  const [journalText, setJournalText] = useState("");
  const [headline, setHeadline] = useState("Today in one sentence");
  const [mood, setMood] = useState<NarrativeMood>("serious");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [compositions, setCompositions] = useState<CompositionHistoryItem[]>([]);
  const [composeJobs, setComposeJobs] = useState<ComposeJobItem[]>([]);
  const [shares, setShares] = useState<CompositionShareItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [memorySnapshot, setMemorySnapshot] = useState<{
    recurringMoods: Array<{ mood: string; count: number }>;
    recurringThemes: Array<{ theme: string; count: number }>;
    reflectionMoments: Array<{
      id: string;
      title: string;
      excerpt: string;
      mode: string;
      mood: string;
      created_at: string;
      reflection: NonNullable<ComposeResponse["reflection"]>;
    }>;
    weeklyRecap: {
      days: number;
      entryCount: number;
      topMood: string | null;
      topThemes: string[];
      summary: string;
    };
    monthlyRecap: {
      days: number;
      entryCount: number;
      topMood: string | null;
      topThemes: string[];
      summary: string;
    };
    recentEntryCount: number;
  } | null>(null);

  const [composeInput, setComposeInput] = useState<ComposeRequest>({
    mode: "essay",
    mood: "serious",
    voiceNotes: "I write like I speak: direct, honest, reflective.",
    sourceText: "",
    stylePreset: "balanced",
    persist: true,
  });
  const [result, setResult] = useState<ComposeResponse | null>(null);
  const [composeStatus, setComposeStatus] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isComposeLoading, setIsComposeLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isEntriesLoading, setIsEntriesLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isComposeJobsLoading, setIsComposeJobsLoading] = useState(false);
  const [isSharesLoading, setIsSharesLoading] = useState(false);
  const [isCollectionsLoading, setIsCollectionsLoading] = useState(false);
  const [isSavingEntry, setIsSavingEntry] = useState(false);
  const [activeShareId, setActiveShareId] = useState<string | null>(null);
  const [activeRevokeShareId, setActiveRevokeShareId] = useState<string | null>(null);
  const [activeExportId, setActiveExportId] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [shareExpiryDays, setShareExpiryDays] = useState(30);
  const [sharePassword, setSharePassword] = useState("");
  const [collectionTitle, setCollectionTitle] = useState("");
  const [collectionDescription, setCollectionDescription] = useState("");
  const [collectionIsPublic, setCollectionIsPublic] = useState(true);
  const [selectedCollectionId, setSelectedCollectionId] = useState("");
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);

  const dailyPrompts = useMemo(() => dailyPromptPack.slice(0, 3), []);
  const lifePrompts = useMemo(() => lifeCyclePromptPack.slice(0, 3), []);

  const loadEntries = useCallback(async () => {
    setIsEntriesLoading(true);

    try {
      const res = await fetch("/api/journal/entries");
      const payload = (await res.json()) as {
        entries?: JournalEntry[];
        error?: string;
      };

      if (!res.ok || !payload.entries) {
        setError(payload.error ?? "Could not load journal entries.");
        return;
      }

      setEntries(payload.entries);
    } finally {
      setIsEntriesLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setIsHistoryLoading(true);

    try {
      const res = await fetch("/api/copilot/history");
      const payload = (await res.json()) as {
        compositions?: CompositionHistoryItem[];
        error?: string;
      };

      if (!res.ok || !payload.compositions) {
        setError(payload.error ?? "Could not load composition history.");
        return;
      }

      setCompositions(payload.compositions);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  const loadComposeJobs = useCallback(async () => {
    setIsComposeJobsLoading(true);

    try {
      const res = await fetch("/api/copilot/compose/jobs");
      const payload = (await res.json()) as {
        jobs?: ComposeJobItem[];
        error?: string;
      };

      if (!res.ok || !payload.jobs) {
        setError(payload.error ?? "Could not load compose jobs.");
        return;
      }

      setComposeJobs(payload.jobs);
    } finally {
      setIsComposeJobsLoading(false);
    }
  }, []);

  const loadShares = useCallback(async () => {
    setIsSharesLoading(true);

    try {
      const res = await fetch("/api/copilot/shares");
      const payload = (await res.json()) as {
        shares?: CompositionShareItem[];
        error?: string;
      };

      if (!res.ok || !payload.shares) {
        setError(payload.error ?? "Could not load share analytics.");
        return;
      }

      setShares(payload.shares);
    } finally {
      setIsSharesLoading(false);
    }
  }, []);

  const loadCollections = useCallback(async () => {
    setIsCollectionsLoading(true);

    try {
      const res = await fetch("/api/collections");
      const payload = (await res.json()) as {
        collections?: Collection[];
        error?: string;
      };

      if (!res.ok || !payload.collections) {
        setError(payload.error ?? "Could not load collections.");
        return;
      }

      setCollections(payload.collections);
      if (!selectedCollectionId && payload.collections.length > 0) {
        setSelectedCollectionId(payload.collections[0].id);
      }
    } finally {
      setIsCollectionsLoading(false);
    }
  }, [selectedCollectionId]);

  const loadMemorySnapshot = useCallback(async () => {
    try {
      const res = await fetch("/api/copilot/memory");
      const payload = (await res.json()) as {
        recurringMoods: Array<{ mood: string; count: number }>;
        recurringThemes: Array<{ theme: string; count: number }>;
        reflectionMoments: Array<{
          id: string;
          title: string;
          excerpt: string;
          mode: string;
          mood: string;
          created_at: string;
          reflection: NonNullable<ComposeResponse["reflection"]>;
        }>;
        weeklyRecap: {
          days: number;
          entryCount: number;
          topMood: string | null;
          topThemes: string[];
          summary: string;
        };
        monthlyRecap: {
          days: number;
          entryCount: number;
          topMood: string | null;
          topThemes: string[];
          summary: string;
        };
        recentEntryCount: number;
        error?: string;
      };

      if (!res.ok) {
        setError(payload.error ?? "Could not load memory view.");
        return;
      }

      setMemorySnapshot(payload);
    } catch {
      setError("Could not load memory view.");
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      setIsAuthLoading(true);

      try {
        const res = await fetch("/api/auth/session");
        const payload = (await res.json()) as { user?: SessionUser; error?: string };

        if (!res.ok || !payload.user) {
          setAuthUser(null);
          return;
        }

        setAuthUser(payload.user);
        await Promise.all([loadEntries(), loadHistory(), loadComposeJobs(), loadShares(), loadCollections(), loadMemorySnapshot()]);
      } finally {
        setIsAuthLoading(false);
      }
    };

    void bootstrap();
  }, [loadEntries, loadHistory, loadComposeJobs, loadShares, loadCollections, loadMemorySnapshot]);

  async function handleAuthSubmit() {
    setIsAuthLoading(true);
    setError(null);

    try {
      const endpoint = authMode === "sign-in" ? "/api/auth/sign-in" : "/api/auth/sign-up";

      const body =
        authMode === "sign-up"
          ? {
              email: authEmail,
              password: authPassword,
              fullName: authFullName || undefined,
            }
          : {
              email: authEmail,
              password: authPassword,
            };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload = (await res.json()) as {
        error?: string;
        user?: SessionUser;
        needsEmailConfirmation?: boolean;
      };

      if (!res.ok || payload.error) {
        setError(payload.error ?? "Authentication failed.");
        return;
      }

      if (payload.user) {
        setAuthUser(payload.user);
        await Promise.all([loadEntries(), loadHistory(), loadComposeJobs(), loadShares(), loadCollections(), loadMemorySnapshot()]);
        setAuthPassword("");
        setAuthFullName("");
        return;
      }

      if (payload.needsEmailConfirmation) {
        setError("Signup succeeded. Confirm your email, then sign in.");
        setAuthMode("sign-in");
      }
    } finally {
      setIsAuthLoading(false);
    }
  }

  async function handleSignOut() {
    setError(null);

    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
    } catch {
      // Ignore sign out API errors and clear local auth state.
    }

    setAuthUser(null);
    setEntries([]);
    setCompositions([]);
    setComposeJobs([]);
    setShares([]);
    setCollections([]);
    setMemorySnapshot(null);
    setResult(null);
  }

  async function saveEntry() {
    if (!headline.trim() || !journalText.trim()) {
      setError("Headline and entry are required.");
      return;
    }

    setIsSavingEntry(true);
    setError(null);

    try {
      const res = await fetch("/api/journal/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          headline,
          body: journalText,
          mood,
          shouldRefine: false,
        }),
      });

      const payload = (await res.json()) as {
        error?: string;
        entry?: JournalEntry;
      };

      if (!res.ok || !payload.entry) {
        setError(payload.error ?? "Could not save journal entry.");
        return;
      }

      setEntries((prev) => [payload.entry!, ...prev]);
      setJournalText("");
      await loadMemorySnapshot();
    } finally {
      setIsSavingEntry(false);
    }
  }

  async function generateDraft() {
    setIsComposeLoading(true);
    setError(null);
    setComposeStatus(null);

    try {
      if (!authUser) {
        const res = await fetch("/api/copilot/compose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(composeInput),
        });

        const data = (await res.json()) as ComposeResponse | { error?: string };

        if (!res.ok || ("error" in data && data.error)) {
          setError("Could not compose draft. Check voice/source length and retry.");
          return;
        }

        setResult(data as ComposeResponse);
        return;
      }

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

      const enqueuePayload = (await enqueueRes.json()) as {
        error?: string;
        job?: { id: string };
      };

      if (!enqueueRes.ok || !enqueuePayload.job?.id) {
        setError(enqueuePayload.error ?? "Could not enqueue compose job.");
        return;
      }

      const jobId = enqueuePayload.job.id;
      setComposeStatus("Draft queued. Processing...");

      let attempts = 0;
      let completed = false;

      while (attempts < 60) {
        attempts += 1;

        await new Promise((resolve) => setTimeout(resolve, 2000));

        const statusRes = await fetch(`/api/copilot/compose/jobs/${jobId}`);
        const statusPayload = (await statusRes.json()) as {
          error?: string;
          job?: {
            status: ComposeJobStatus;
            last_error?: string | null;
          };
          composition?: {
            title: string;
            excerpt: string;
            draft: string;
            editorial_notes: string[];
          } | null;
        };

        if (!statusRes.ok || !statusPayload.job) {
          setError(statusPayload.error ?? "Could not track compose job.");
          return;
        }

        if (statusPayload.job.status === "queued") {
          setComposeStatus("Draft queued. Waiting for worker...");
          continue;
        }

        if (statusPayload.job.status === "processing") {
          setComposeStatus("AI is writing your draft...");
          continue;
        }

        if (statusPayload.job.status === "failed") {
          setError(statusPayload.job.last_error ?? "Compose job failed.");
          setComposeStatus(null);
          return;
        }

        if (statusPayload.job.status === "completed" && statusPayload.composition) {
          setResult({
            title: statusPayload.composition.title,
            excerpt: statusPayload.composition.excerpt,
            draft: statusPayload.composition.draft,
            editorialNotes: statusPayload.composition.editorial_notes,
          });
          setComposeStatus("Draft ready.");
          completed = true;
          break;
        }
      }

      if (!completed) {
        setError("Compose job is taking longer than expected. Check history in a moment.");
      }

      if (composeInput.persist !== false) {
        await Promise.all([loadHistory(), loadComposeJobs(), loadMemorySnapshot()]);
      }
    } finally {
      setIsComposeLoading(false);
    }
  }

  function downloadContent(filename: string, content: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function createShareLink(compositionId: string) {
    setActiveShareId(compositionId);
    setShareStatus(null);
    setError(null);

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

      const payload = (await res.json()) as {
        error?: string;
        share?: { token: string };
      };

      if (!res.ok || !payload.share?.token) {
        setError(payload.error ?? "Could not create share link.");
        return;
      }

      const link = `${window.location.origin}/share/${payload.share.token}`;
      await navigator.clipboard.writeText(link);
      setShareStatus(`Share link copied. Expires in ${shareExpiryDays} day(s).`);
      await loadShares();
    } finally {
      setActiveShareId(null);
    }
  }

  async function createCollection() {
    if (!collectionTitle.trim()) {
      setError("Collection title is required.");
      return;
    }

    setActiveCollectionId("create");
    setError(null);

    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: collectionTitle.trim(),
          description: collectionDescription.trim(),
          isPublic: collectionIsPublic,
        }),
      });

      const payload = (await res.json()) as { error?: string; collection?: Collection };

      if (!res.ok || !payload.collection) {
        setError(payload.error ?? "Could not create collection.");
        return;
      }

      setCollectionTitle("");
      setCollectionDescription("");
      setSelectedCollectionId(payload.collection.id);
      await loadCollections();
      setShareStatus("Collection created.");
    } finally {
      setActiveCollectionId(null);
    }
  }

  async function addToCollection(compositionId: string) {
    if (!selectedCollectionId) {
      setError("Select a collection first.");
      return;
    }

    setActiveCollectionId(compositionId);
    setError(null);

    try {
      const res = await fetch(`/api/collections/${selectedCollectionId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ compositionId }),
      });

      const payload = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(payload.error ?? "Could not add composition to collection.");
        return;
      }

      await loadCollections();
      setShareStatus("Added to collection.");
    } finally {
      setActiveCollectionId(null);
    }
  }

  async function revokeShare(shareId: string) {
    setActiveRevokeShareId(shareId);
    setError(null);
    setShareStatus(null);

    try {
      const res = await fetch(`/api/copilot/shares/${shareId}`, { method: "DELETE" });
      const payload = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(payload.error ?? "Could not revoke share link.");
        return;
      }

      setShareStatus("Share link revoked.");
      await loadShares();
    } finally {
      setActiveRevokeShareId(null);
    }
  }

  function findLatestShareForComposition(compositionId: string) {
    return shares.find((share) => share.composition_id === compositionId && !share.is_revoked) ?? null;
  }

  async function exportComposition(compositionId: string, format: "markdown" | "text") {
    setActiveExportId(compositionId);
    setError(null);

    try {
      const res = await fetch("/api/copilot/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ compositionId, format }),
      });

      const payload = (await res.json()) as {
        error?: string;
        filename?: string;
        content?: string;
        mimeType?: string;
      };

      if (!res.ok || !payload.filename || !payload.content || !payload.mimeType) {
        setError(payload.error ?? "Could not export composition.");
        return;
      }

      downloadContent(payload.filename, payload.content, payload.mimeType);
    } finally {
      setActiveExportId(null);
    }
  }

  function openHistoryItem(item: CompositionHistoryItem) {
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

    setMode("copilot");
  }

  async function openComposeJobItem(job: ComposeJobItem) {
    if (job.status !== "completed") {
      return;
    }

    setError(null);

    const res = await fetch(`/api/copilot/compose/jobs/${job.id}`);
    const payload = (await res.json()) as {
      error?: string;
      composition?: {
        title: string;
        excerpt: string;
        draft: string;
        editorial_notes: string[];
        reflection?: ComposeResponse["reflection"];
      } | null;
    };

    if (!res.ok || !payload.composition) {
      setError(payload.error ?? "Could not open compose job result.");
      return;
    }

    setResult({
      title: payload.composition.title,
      excerpt: payload.composition.excerpt,
      draft: payload.composition.draft,
      editorialNotes: payload.composition.editorial_notes,
      reflection: payload.composition.reflection,
    });

    setComposeStatus("Loaded from async job history.");
    await Promise.all([loadHistory(), loadMemorySnapshot()]);
  }

  const isAuthenticated = Boolean(authUser);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <JournaHero isAuthenticated={isAuthenticated} userEmail={authUser?.email} onSignOut={handleSignOut} />
      </motion.div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant={mode === "journal" ? "default" : "secondary"} onClick={() => setMode("journal")}>
          <BookOpenText className="mr-2 h-4 w-4" /> Journal Mode
        </Button>
        <Button variant={mode === "copilot" ? "default" : "secondary"} onClick={() => setMode("copilot")}>
          <WandSparkles className="mr-2 h-4 w-4" /> Copilot Mode
        </Button>
      </div>

      <LifeOnboardingCard
        enabled={isAuthenticated}
        onBuildNarrative={({ sourceText, voiceNotes }) => {
          setComposeInput((prev) => ({
            ...prev,
            mode: "autobiography",
            mood: "serious",
            stylePreset: "soulful",
            sourceText,
            voiceNotes,
            persist: true,
          }));
          setMode("copilot");
        }}
      />

      {!isAuthenticated ? (
        <AuthCard
          authMode={authMode}
          authEmail={authEmail}
          authPassword={authPassword}
          authFullName={authFullName}
          isAuthLoading={isAuthLoading}
          setAuthMode={setAuthMode}
          setAuthEmail={setAuthEmail}
          setAuthPassword={setAuthPassword}
          setAuthFullName={setAuthFullName}
          onSubmit={handleAuthSubmit}
        />
      ) : null}

      {mode === "journal" ? (
        <JournalPanel
          mood={mood}
          moods={moods}
          headline={headline}
          journalText={journalText}
          isAuthenticated={isAuthenticated}
          isSavingEntry={isSavingEntry}
          isEntriesLoading={isEntriesLoading}
          entries={entries}
          dailyPrompts={dailyPrompts}
          setMood={setMood}
          setHeadline={setHeadline}
          setJournalText={setJournalText}
          onSaveEntry={saveEntry}
          onReflect={() => {
            setComposeInput((prev) => ({ ...prev, sourceText: journalText, mood }));
            setMode("copilot");
          }}
          formatDate={formatDate}
        />
      ) : (
        <CopilotPanel
          isAuthenticated={isAuthenticated}
          lifePrompts={lifePrompts}
          composeInput={composeInput}
          moods={moods}
          writingModes={writingModes}
          stylePresets={stylePresets}
          copilotTemplates={copilotTemplates}
          composeStatus={composeStatus}
          result={result}
          isComposeLoading={isComposeLoading}
          isComposeJobsLoading={isComposeJobsLoading}
          isHistoryLoading={isHistoryLoading}
          isSharesLoading={isSharesLoading}
          isCollectionsLoading={isCollectionsLoading}
          composeJobs={composeJobs}
          compositions={compositions}
          shares={shares}
          collections={collections}
          selectedCollectionId={selectedCollectionId}
          collectionTitle={collectionTitle}
          collectionDescription={collectionDescription}
          collectionIsPublic={collectionIsPublic}
          shareExpiryDays={shareExpiryDays}
          sharePassword={sharePassword}
          activeCollectionId={activeCollectionId}
          activeShareId={activeShareId}
          activeExportId={activeExportId}
          activeRevokeShareId={activeRevokeShareId}
          shareStatus={shareStatus}
          memorySnapshot={memorySnapshot}
          setComposeInput={(updater) => setComposeInput(updater)}
          setSelectedCollectionId={setSelectedCollectionId}
          setCollectionTitle={setCollectionTitle}
          setCollectionDescription={setCollectionDescription}
          setCollectionIsPublic={setCollectionIsPublic}
          setShareExpiryDays={setShareExpiryDays}
          setSharePassword={setSharePassword}
          onGenerateDraft={generateDraft}
          onLoadComposeJobs={loadComposeJobs}
          onOpenComposeJobItem={openComposeJobItem}
          onCreateCollection={createCollection}
          onAddToCollection={addToCollection}
          onCreateShareLink={createShareLink}
          onExportComposition={exportComposition}
          onRevokeShare={revokeShare}
          onOpenHistoryItem={openHistoryItem}
          findLatestShareForComposition={findLatestShareForComposition}
          formatDate={formatDate}
        />
      )}

      {error ? (
        <Card className="mt-6 border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </Card>
      ) : null}

      {result ? (
        <Card className="mt-8 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">
                {result.reflection ? "Reflection result" : "Rewrite result"}
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-[var(--ink-950)]">{result.title}</h2>
              <p className="mt-2 text-sm text-[var(--ink-700)]">{result.excerpt}</p>
            </div>
          </div>
          {result.reflection ? (
            <>
              <div className="mt-4 grid gap-3 rounded-2xl bg-[var(--sand-50)] p-4 text-sm text-[var(--ink-800)] sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">What happened</p>
                  <p className="mt-1">{result.reflection.summary}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">What mattered</p>
                  <p className="mt-1">{result.reflection.whatMattered}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">Beneath the surface</p>
                  <p className="mt-1">{result.reflection.beneathTheSurface}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">Follow-up question</p>
                  <p className="mt-1">{result.reflection.followUpQuestion}</p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-[var(--ink-300)] bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">A good next journal prompt</p>
                <p className="mt-2 text-sm text-[var(--ink-900)]">{result.reflection.followUpQuestion}</p>
              </div>
            </>
          ) : null}
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">
            {result.reflection ? "Polished reflection" : "Draft"}
          </p>
          <pre className="mt-2 whitespace-pre-wrap rounded-2xl bg-[var(--sand-50)] p-4 text-sm leading-relaxed text-[var(--ink-900)]">
            {result.draft}
          </pre>
          <div className="mt-4 rounded-2xl bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">What Journa changed</p>
            <ul className="mt-3 space-y-2 text-sm text-[var(--ink-700)]">
              {result.editorialNotes.map((note) => (
                <li key={note}>- {note}</li>
              ))}
            </ul>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

