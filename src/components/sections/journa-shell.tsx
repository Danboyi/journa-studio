"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpenText, History, LogOut, Sparkles, WandSparkles } from "lucide-react";
import { motion } from "framer-motion";

import { LifeOnboardingCard } from "@/components/onboarding/life-onboarding-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
  mode: WritingMode;
  stylePreset: StylePreset;
  mood: NarrativeMood;
}> = [
  { id: "sop", label: "SOP Pro", mode: "statement-of-purpose", stylePreset: "academic", mood: "serious" },
  { id: "bio", label: "Bio Snapshot", mode: "biography", stylePreset: "balanced", mood: "serious" },
  { id: "life", label: "Life Story", mode: "autobiography", stylePreset: "soulful", mood: "serious" },
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
        await Promise.all([loadEntries(), loadHistory(), loadComposeJobs(), loadShares(), loadCollections()]);
      } finally {
        setIsAuthLoading(false);
      }
    };

    void bootstrap();
  }, [loadEntries, loadHistory, loadComposeJobs, loadShares, loadCollections]);

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
        await Promise.all([loadEntries(), loadHistory(), loadComposeJobs(), loadShares(), loadCollections()]);
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
        await Promise.all([loadHistory(), loadComposeJobs()]);
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
    });

    setComposeStatus("Loaded from async job history.");
    await loadHistory();
  }

  const isAuthenticated = Boolean(authUser);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-[2.2rem] border border-white/50 bg-[radial-gradient(circle_at_top_left,_#cffafe_0,_#f8fafc_50%,_#fef3c7_100%)] p-6 sm:p-10"
      >
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[var(--brand-300)]/45 blur-3xl" />
        <Badge>Private memory studio</Badge>
        <h1 className="mt-4 max-w-3xl text-4xl leading-tight font-semibold tracking-tight text-[var(--ink-950)] sm:text-5xl">
          Write privately. Reflect deeply. Remember clearly.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-[var(--ink-700)] sm:text-lg">
          Journa turns everyday thoughts into a private memory system. Capture your day in natural language, get thoughtful AI reflection, and transform raw notes into polished writing without losing your voice.
        </p>
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-[var(--ink-700)] sm:text-sm">
          <span className="rounded-full bg-white/70 px-3 py-1">Private by default</span>
          <span className="rounded-full bg-white/70 px-3 py-1">AI that preserves your tone</span>
          <span className="rounded-full bg-white/70 px-3 py-1">Built for reflection, not noise</span>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            variant={mode === "journal" ? "default" : "secondary"}
            onClick={() => setMode("journal")}
          >
            <BookOpenText className="mr-2 h-4 w-4" /> Journal Mode
          </Button>
          <Button
            variant={mode === "copilot" ? "default" : "secondary"}
            onClick={() => setMode("copilot")}
          >
            <WandSparkles className="mr-2 h-4 w-4" /> Copilot Mode
          </Button>
          {isAuthenticated ? (
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" /> {authUser?.email}
            </Button>
          ) : null}
        </div>
      </motion.section>

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
        <Card className="mt-8 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-[var(--ink-900)]">Secure Account Access</h2>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={authMode === "sign-in" ? "default" : "secondary"}
                onClick={() => setAuthMode("sign-in")}
              >
                Sign in
              </Button>
              <Button
                size="sm"
                variant={authMode === "sign-up" ? "default" : "secondary"}
                onClick={() => setAuthMode("sign-up")}
              >
                Sign up
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              className="h-11 rounded-xl border border-[var(--ink-300)] bg-white/90 px-4 text-sm"
              placeholder="Email"
              type="email"
              value={authEmail}
              onChange={(event) => setAuthEmail(event.target.value)}
            />
            <input
              className="h-11 rounded-xl border border-[var(--ink-300)] bg-white/90 px-4 text-sm"
              placeholder="Password"
              type="password"
              value={authPassword}
              onChange={(event) => setAuthPassword(event.target.value)}
            />
            {authMode === "sign-up" ? (
              <input
                className="h-11 rounded-xl border border-[var(--ink-300)] bg-white/90 px-4 text-sm sm:col-span-2"
                placeholder="Full name (optional)"
                value={authFullName}
                onChange={(event) => setAuthFullName(event.target.value)}
              />
            ) : null}
          </div>

          <Button className="mt-4" onClick={handleAuthSubmit} disabled={isAuthLoading}>
            {isAuthLoading ? "Please wait..." : authMode === "sign-in" ? "Sign in" : "Create account"}
          </Button>
          <p className="mt-2 text-xs text-[var(--ink-700)]">
            Auth uses secure HTTP-only cookies. For sign-up, confirm email if your Supabase project enforces verification.
          </p>
          <div className="mt-4 grid gap-2 text-xs text-[var(--ink-700)] sm:grid-cols-3">
            <div className="rounded-2xl bg-[var(--sand-50)] p-3">Your writing stays tied to your account, not a public feed.</div>
            <div className="rounded-2xl bg-[var(--sand-50)] p-3">Use Copilot to reflect and rewrite without flattening your voice.</div>
            <div className="rounded-2xl bg-[var(--sand-50)] p-3">Sharing is optional and explicit — private remains the default posture.</div>
          </div>
        </Card>
      ) : null}

      {mode === "journal" ? (
        <section className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <Card className="p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[var(--ink-900)]">Daily Capture</h2>
              <Badge>{mood}</Badge>
            </div>
            <input
              value={headline}
              onChange={(event) => setHeadline(event.target.value)}
              className="mb-3 h-11 w-full rounded-xl border border-[var(--ink-300)] px-4 text-sm"
              placeholder="Headline"
            />
            <Textarea
              value={journalText}
              onChange={(event) => setJournalText(event.target.value)}
              placeholder="Write exactly how you speak. No pressure to sound like a writer."
              className="min-h-[220px]"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {moods.map((tone) => (
                <Button
                  key={tone}
                  variant={tone === mood ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setMood(tone)}
                >
                  {tone}
                </Button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={saveEntry} disabled={!isAuthenticated || isSavingEntry}>
                {isSavingEntry ? "Saving..." : "Save entry"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setComposeInput((prev) => ({ ...prev, sourceText: journalText, mood }));
                  setMode("copilot");
                }}
              >
                <Sparkles className="mr-2 h-4 w-4" /> Use entry in Copilot
              </Button>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <h3 className="text-sm font-semibold tracking-[0.12em] text-[var(--ink-700)] uppercase">
              {isAuthenticated ? "Recent entries" : "Smart prompts"}
            </h3>
            {isAuthenticated ? (
              <div className="mt-3 space-y-3 text-sm text-[var(--ink-800)]">
                {isEntriesLoading ? <p>Loading entries...</p> : null}
                {!isEntriesLoading && entries.length === 0 ? (
                  <p>No entries yet. Save your first journal above.</p>
                ) : null}
                {entries.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="rounded-xl bg-white/80 p-3">
                    <p className="text-xs uppercase tracking-[0.1em] text-[var(--ink-500)]">
                      {entry.mood} - {formatDate(entry.created_at)}
                    </p>
                    <p className="mt-1 font-semibold text-[var(--ink-900)]">{entry.headline}</p>
                    <p className="mt-1 line-clamp-2">{entry.body}</p>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="mt-3 space-y-3 text-sm text-[var(--ink-800)]">
                {dailyPrompts.map((prompt) => (
                  <li key={prompt} className="rounded-xl bg-white/80 p-3">
                    {prompt}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>
      ) : (
        <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Card className="p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-[var(--ink-900)]">Copilot Composer</h2>
            <p className="mt-1 text-sm text-[var(--ink-700)]">
              Transform rough notes into a polished draft while preserving voice.
            </p>

            <label className="mt-4 block text-sm font-medium">Quick templates</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {copilotTemplates.map((template) => (
                <Button
                  key={template.id}
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setComposeInput((prev) => ({
                      ...prev,
                      mode: template.mode,
                      mood: template.mood,
                      stylePreset: template.stylePreset,
                    }))
                  }
                >
                  {template.label}
                </Button>
              ))}
            </div>

            <label className="mt-4 block text-sm font-medium">Writing output</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {writingModes.map((writingMode) => (
                <Button
                  key={writingMode}
                  variant={writingMode === composeInput.mode ? "default" : "secondary"}
                  size="sm"
                  onClick={() =>
                    setComposeInput((prev) => ({ ...prev, mode: writingMode }))
                  }
                >
                  {writingMode}
                </Button>
              ))}
            </div>

            <label className="mt-4 block text-sm font-medium">Style pack</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {stylePresets.map((preset) => (
                <Button
                  key={preset}
                  variant={preset === composeInput.stylePreset ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setComposeInput((prev) => ({ ...prev, stylePreset: preset }))}
                >
                  {preset}
                </Button>
              ))}
            </div>

            <label className="mt-4 block text-sm font-medium">Voice profile</label>
            <Textarea
              className="mt-2 min-h-[100px]"
              value={composeInput.voiceNotes}
              onChange={(event) =>
                setComposeInput((prev) => ({ ...prev, voiceNotes: event.target.value }))
              }
            />

            <label className="mt-4 block text-sm font-medium">Source notes</label>
            <Textarea
              className="mt-2 min-h-[180px]"
              value={composeInput.sourceText}
              onChange={(event) =>
                setComposeInput((prev) => ({ ...prev, sourceText: event.target.value }))
              }
              placeholder="Paste journal entries, memories, project notes, or life events."
            />

            <div className="mt-4 flex flex-wrap gap-2">
              {moods.map((tone) => (
                <Button
                  key={tone}
                  variant={tone === composeInput.mood ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setComposeInput((prev) => ({ ...prev, mood: tone }))}
                >
                  {tone}
                </Button>
              ))}
            </div>

            <Button className="mt-5 w-full" onClick={generateDraft} disabled={isComposeLoading}>
              {isComposeLoading ? "Composing..." : "Generate polished draft"}
            </Button>
            {composeStatus ? <p className="mt-2 text-xs text-[var(--ink-700)]">{composeStatus}</p> : null}
          </Card>

          <Card className="p-5 sm:p-6">
            <h3 className="text-sm font-semibold tracking-[0.12em] text-[var(--ink-700)] uppercase">
              Life-cycle prompts
            </h3>
            <ul className="mt-3 space-y-3 text-sm text-[var(--ink-800)]">
              {lifePrompts.map((prompt) => (
                <li key={prompt} className="rounded-xl bg-white/80 p-3">
                  {prompt}
                </li>
              ))}
            </ul>

            {isAuthenticated ? (
              <>
                <div className="mt-5 rounded-xl border border-[var(--ink-300)] bg-white/70 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-600)]">
                      Async compose jobs
                    </p>
                    <Button size="sm" variant="secondary" onClick={loadComposeJobs} disabled={isComposeJobsLoading}>
                      {isComposeJobsLoading ? "Refreshing..." : "Refresh"}
                    </Button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {isComposeJobsLoading ? (
                      <p className="text-sm text-[var(--ink-700)]">Loading compose jobs...</p>
                    ) : null}
                    {!isComposeJobsLoading && composeJobs.length === 0 ? (
                      <p className="text-sm text-[var(--ink-700)]">
                        No async jobs yet. Generate a draft to queue one.
                      </p>
                    ) : null}
                    {composeJobs.slice(0, 6).map((job) => (
                      <div key={job.id} className="rounded-xl border border-[var(--ink-300)] bg-white/80 p-3">
                        <p className="text-xs uppercase tracking-[0.1em] text-[var(--ink-500)]">
                          {job.status} - attempt {job.attempt_count}/{job.max_attempts} - {formatDate(job.created_at)}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[var(--ink-900)]">
                          {job.composition?.title ?? "Pending composition output"}
                        </p>
                        {job.last_error ? (
                          <p className="mt-1 text-xs text-red-700">{job.last_error}</p>
                        ) : (
                          <p className="mt-1 text-xs text-[var(--ink-600)]">
                            {job.composition?.excerpt ?? "Awaiting worker processing."}
                          </p>
                        )}
                        <div className="mt-2 flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={job.status !== "completed"}
                            onClick={() => openComposeJobItem(job)}
                          >
                            Open Result
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <p className="inline-flex items-center text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-700)]">
                    <History className="mr-2 h-3.5 w-3.5" /> Composition history
                  </p>
                </div>
                <div className="mt-3 rounded-xl border border-[var(--ink-300)] bg-white/70 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-600)]">
                    Collections
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <input
                      value={collectionTitle}
                      onChange={(event) => setCollectionTitle(event.target.value)}
                      className="h-10 rounded-xl border border-[var(--ink-300)] bg-white/90 px-3 text-sm"
                      placeholder="New collection title"
                    />
                    <input
                      value={collectionDescription}
                      onChange={(event) => setCollectionDescription(event.target.value)}
                      className="h-10 rounded-xl border border-[var(--ink-300)] bg-white/90 px-3 text-sm"
                      placeholder="Optional description"
                    />
                    <select
                      value={selectedCollectionId}
                      onChange={(event) => setSelectedCollectionId(event.target.value)}
                      className="h-10 rounded-xl border border-[var(--ink-300)] bg-white/90 px-3 text-sm"
                    >
                      <option value="">Select collection</option>
                      {collections.map((collection) => (
                        <option key={collection.id} value={collection.id}>
                          {collection.title}
                        </option>
                      ))}
                    </select>
                    <label className="inline-flex items-center gap-2 rounded-xl border border-[var(--ink-300)] bg-white/90 px-3 text-sm">
                      <input
                        type="checkbox"
                        checked={collectionIsPublic}
                        onChange={(event) => setCollectionIsPublic(event.target.checked)}
                      />
                      Public collection
                    </label>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={createCollection}
                      disabled={activeCollectionId === "create"}
                    >
                      {activeCollectionId === "create" ? "Creating..." : "Create Collection"}
                    </Button>
                    {selectedCollectionId ? (
                      <a
                        className="inline-flex h-9 items-center rounded-full bg-[var(--sand-100)] px-4 text-xs font-semibold text-[var(--ink-800)]"
                        href={`/collections/${collections.find((item) => item.id === selectedCollectionId)?.slug ?? ""}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open Collection
                      </a>
                    ) : null}
                    {isCollectionsLoading ? (
                      <span className="inline-flex h-9 items-center text-xs text-[var(--ink-600)]">
                        Syncing collections...
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={shareExpiryDays}
                    onChange={(event) => setShareExpiryDays(Number(event.target.value || 30))}
                    className="h-10 rounded-xl border border-[var(--ink-300)] bg-white/90 px-3 text-sm"
                    placeholder="Share expiry in days"
                  />
                  <input
                    type="password"
                    value={sharePassword}
                    onChange={(event) => setSharePassword(event.target.value)}
                    className="h-10 rounded-xl border border-[var(--ink-300)] bg-white/90 px-3 text-sm"
                    placeholder="Optional share password"
                  />
                </div>
                <div className="mt-3 space-y-2">
                  {isHistoryLoading ? <p className="text-sm text-[var(--ink-700)]">Loading history...</p> : null}
                  {isSharesLoading ? <p className="text-sm text-[var(--ink-700)]">Loading share analytics...</p> : null}
                  {!isHistoryLoading && compositions.length === 0 ? (
                    <p className="text-sm text-[var(--ink-700)]">No saved compositions yet.</p>
                  ) : null}
                  {compositions.slice(0, 6).map((item) => (
                    <div key={item.id} className="rounded-xl border border-[var(--ink-300)] bg-white/80 p-3">
                      <p className="text-xs uppercase tracking-[0.1em] text-[var(--ink-500)]">
                        {item.mode} - {item.mood} - {item.style_preset ?? "balanced"} - {formatDate(item.created_at)}
                      </p>
                      <p className="mt-1 font-semibold text-[var(--ink-900)]">{item.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-[var(--ink-700)]">{item.excerpt}</p>
                      {findLatestShareForComposition(item.id) ? (
                        <p className="mt-1 text-xs text-[var(--ink-600)]">
                          Views: {findLatestShareForComposition(item.id)?.view_count ?? 0}
                          {" · "}
                          Last view: {findLatestShareForComposition(item.id)?.last_viewed_at ? formatDate(findLatestShareForComposition(item.id)!.last_viewed_at!) : "Never"}
                          {" · "}
                          {findLatestShareForComposition(item.id)?.password_protected ? "Password protected" : "Open link"}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" onClick={() => openHistoryItem(item)}>
                          Open
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={!selectedCollectionId || activeCollectionId === item.id}
                          onClick={() => addToCollection(item.id)}
                        >
                          {activeCollectionId === item.id ? "Adding..." : "Add to Collection"}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={activeShareId === item.id}
                          onClick={() => createShareLink(item.id)}
                        >
                          {activeShareId === item.id ? "Sharing..." : "Copy Link"}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={activeExportId === item.id}
                          onClick={() => exportComposition(item.id, "markdown")}
                        >
                          {activeExportId === item.id ? "Exporting..." : "Export .md"}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={activeExportId === item.id}
                          onClick={() => exportComposition(item.id, "text")}
                        >
                          {activeExportId === item.id ? "Exporting..." : "Export .txt"}
                        </Button>
                        {findLatestShareForComposition(item.id) ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={activeRevokeShareId === findLatestShareForComposition(item.id)?.id}
                            onClick={() => revokeShare(findLatestShareForComposition(item.id)!.id)}
                          >
                            {activeRevokeShareId === findLatestShareForComposition(item.id)?.id
                              ? "Revoking..."
                              : "Revoke Link"}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
                {shareStatus ? <p className="mt-3 text-xs text-emerald-700">{shareStatus}</p> : null}
              </>
            ) : (
              <div className="mt-5 rounded-xl bg-[var(--ink-950)] p-4 text-[var(--sand-50)]">
                <p className="text-xs tracking-[0.08em] uppercase">Output preview</p>
                <p className="mt-2 text-sm leading-relaxed">
                  {result?.excerpt ??
                    "Your refined draft appears here with edit notes and structure."}
                </p>
              </div>
            )}
          </Card>
        </section>
      )}

      {error ? (
        <Card className="mt-6 border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </Card>
      ) : null}

      {result ? (
        <Card className="mt-8 p-5 sm:p-6">
          <h2 className="text-2xl font-semibold text-[var(--ink-950)]">{result.title}</h2>
          <p className="mt-2 text-sm text-[var(--ink-700)]">{result.excerpt}</p>
          <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-[var(--sand-50)] p-4 text-sm leading-relaxed text-[var(--ink-900)]">
            {result.draft}
          </pre>
          <ul className="mt-4 space-y-2 text-sm text-[var(--ink-700)]">
            {result.editorialNotes.map((note) => (
              <li key={note}>- {note}</li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}

