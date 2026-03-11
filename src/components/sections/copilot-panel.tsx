import { History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type {
  Collection,
  ComposeJobItem,
  CompositionHistoryItem,
  CompositionShareItem,
  ComposeRequest,
  ComposeResponse,
  NarrativeMood,
  StylePreset,
  WritingMode,
} from "@/types/journa";

type CopilotTemplate = {
  id: string;
  label: string;
  description?: string;
  mode: WritingMode;
  stylePreset: StylePreset;
  mood: NarrativeMood;
};

type MemorySnapshot = {
  recurringMoods: Array<{ mood: string; count: number }>;
  recurringThemes: Array<{ theme: string; count: number }>;
  reflectionMoments: Array<{
    id: string;
    title: string;
    excerpt: string;
    mode: string;
    mood: string;
    created_at: string;
    reflection: {
      summary: string;
      whatMattered: string;
      beneathTheSurface: string;
      followUpQuestion: string;
    };
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
};

type RetrievalResult = {
  id: string;
  kind: "entry" | "composition";
  title: string;
  mood: string;
  mode?: string;
  created_at: string;
  score: number;
  snippet: string;
  whyRelated: string;
};

type CopilotPanelProps = {
  isAuthenticated: boolean;
  lifePrompts: string[];
  composeInput: ComposeRequest;
  moods: NarrativeMood[];
  writingModes: WritingMode[];
  stylePresets: StylePreset[];
  copilotTemplates: CopilotTemplate[];
  composeStatus: string | null;
  result: ComposeResponse | null;
  isComposeLoading: boolean;
  isComposeJobsLoading: boolean;
  isHistoryLoading: boolean;
  isSharesLoading: boolean;
  isCollectionsLoading: boolean;
  composeJobs: ComposeJobItem[];
  compositions: CompositionHistoryItem[];
  shares: CompositionShareItem[];
  collections: Collection[];
  selectedCollectionId: string;
  collectionTitle: string;
  collectionDescription: string;
  collectionIsPublic: boolean;
  shareExpiryDays: number;
  sharePassword: string;
  activeCollectionId: string | null;
  activeShareId: string | null;
  activeExportId: string | null;
  activeRevokeShareId: string | null;
  shareStatus: string | null;
  memorySnapshot: MemorySnapshot | null;
  retrievalQuery: string;
  retrievalResults: { entries: RetrievalResult[]; compositions: RetrievalResult[] } | null;
  isRetrievalLoading: boolean;
  setComposeInput: (updater: (prev: ComposeRequest) => ComposeRequest) => void;
  setRetrievalQuery: (value: string) => void;
  setSelectedCollectionId: (value: string) => void;
  setCollectionTitle: (value: string) => void;
  setCollectionDescription: (value: string) => void;
  setCollectionIsPublic: (value: boolean) => void;
  setShareExpiryDays: (value: number) => void;
  setSharePassword: (value: string) => void;
  onGenerateDraft: () => void;
  onLoadComposeJobs: () => void;
  onOpenComposeJobItem: (job: ComposeJobItem) => void;
  onCreateCollection: () => void;
  onAddToCollection: (compositionId: string) => void;
  onCreateShareLink: (compositionId: string) => void;
  onExportComposition: (compositionId: string, format: "markdown" | "text") => void;
  onRevokeShare: (shareId: string) => void;
  onOpenHistoryItem: (item: CompositionHistoryItem) => void;
  onRetrieve: () => void;
  findLatestShareForComposition: (compositionId: string) => CompositionShareItem | null;
  formatDate: (value: string) => string;
};

function isReflectionMode(mode: WritingMode) {
  return mode === "daily-journal" || mode === "essay";
}

export function CopilotPanel(props: CopilotPanelProps) {
  const {
    isAuthenticated,
    lifePrompts,
    composeInput,
    moods,
    writingModes,
    stylePresets,
    copilotTemplates,
    composeStatus,
    result,
    isComposeLoading,
    isComposeJobsLoading,
    isHistoryLoading,
    isSharesLoading,
    isCollectionsLoading,
    composeJobs,
    compositions,
    collections,
    selectedCollectionId,
    collectionTitle,
    collectionDescription,
    collectionIsPublic,
    shareExpiryDays,
    sharePassword,
    activeCollectionId,
    activeShareId,
    activeExportId,
    activeRevokeShareId,
    shareStatus,
    memorySnapshot,
    retrievalQuery,
    retrievalResults,
    isRetrievalLoading,
    setComposeInput,
    setRetrievalQuery,
    setSelectedCollectionId,
    setCollectionTitle,
    setCollectionDescription,
    setCollectionIsPublic,
    setShareExpiryDays,
    setSharePassword,
    onGenerateDraft,
    onLoadComposeJobs,
    onOpenComposeJobItem,
    onCreateCollection,
    onAddToCollection,
    onCreateShareLink,
    onExportComposition,
    onRevokeShare,
    onOpenHistoryItem,
    onRetrieve,
    findLatestShareForComposition,
    formatDate,
  } = props;

  const reflectionMode = isReflectionMode(composeInput.mode);

  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <Card className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-[var(--ink-900)]">Copilot</h2>
            <p className="mt-1 text-sm text-[var(--ink-700)]">
              Start with reflection first, then shape your writing into something polished when you need to.
            </p>
          </div>
          <span className="rounded-full bg-[var(--sand-50)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-700)]">
            {reflectionMode ? "Reflection mode" : "Rewrite mode"}
          </span>
        </div>

        <div className="mt-4 rounded-2xl bg-[var(--sand-50)] p-4 text-sm text-[var(--ink-800)]">
          <p className="font-semibold text-[var(--ink-900)]">{reflectionMode ? "What reflection mode does" : "What rewrite mode does"}</p>
          <p className="mt-1 text-[var(--ink-700)]">
            {reflectionMode
              ? "Journa reads for meaning first: what happened, what mattered, what sits underneath it, and what question is worth carrying forward."
              : "Journa focuses on transformation: stronger structure, cleaner pacing, and a more finished piece without flattening your voice."}
          </p>
        </div>

        <label className="mt-4 block text-sm font-medium">Quick actions</label>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {copilotTemplates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() =>
                setComposeInput((prev) => ({
                  ...prev,
                  mode: template.mode,
                  mood: template.mood,
                  stylePreset: template.stylePreset,
                }))
              }
              className="rounded-2xl border border-[var(--ink-300)] bg-white/85 p-3 text-left transition hover:border-[var(--brand-700)] hover:bg-white"
            >
              <p className="text-sm font-semibold text-[var(--ink-900)]">{template.label}</p>
              {template.description ? <p className="mt-1 text-xs text-[var(--ink-700)]">{template.description}</p> : null}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-sm font-medium">Output format</label>
        <p className="mt-1 text-xs text-[var(--ink-700)]">
          {reflectionMode
            ? "Essay and daily-journal modes keep the experience closer to reflection than full transformation."
            : "Story, autobiography, biography, and other long-form modes push toward stronger transformation."}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {writingModes.map((writingMode) => (
            <Button
              key={writingMode}
              variant={writingMode === composeInput.mode ? "default" : "secondary"}
              size="sm"
              onClick={() => setComposeInput((prev) => ({ ...prev, mode: writingMode }))}
            >
              {writingMode}
            </Button>
          ))}
        </div>

        <label className="mt-4 block text-sm font-medium">Style</label>
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
        <p className="mt-1 text-xs text-[var(--ink-700)]">
          Tell Copilot how close it should stay to your natural rhythm, phrasing, and emotional tone.
        </p>
        <Textarea
          className="mt-2 min-h-[100px]"
          value={composeInput.voiceNotes}
          onChange={(event) => setComposeInput((prev) => ({ ...prev, voiceNotes: event.target.value }))}
        />

        <label className="mt-4 block text-sm font-medium">Source notes</label>
        <p className="mt-1 text-xs text-[var(--ink-700)]">
          Journal entries, messy thoughts, memory fragments, project notes — anything real is useful here.
        </p>
        <Textarea
          className="mt-2 min-h-[180px]"
          value={composeInput.sourceText}
          onChange={(event) => setComposeInput((prev) => ({ ...prev, sourceText: event.target.value }))}
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

        <Button className="mt-5 w-full" onClick={onGenerateDraft} disabled={isComposeLoading}>
          {isComposeLoading ? "Thinking..." : reflectionMode ? "Generate reflection" : "Generate rewrite"}
        </Button>
        {composeStatus ? <p className="mt-2 text-xs text-[var(--ink-700)]">{composeStatus}</p> : null}
      </Card>

      <Card className="p-5 sm:p-6">
        <h3 className="text-sm font-semibold tracking-[0.12em] text-[var(--ink-700)] uppercase">Life-cycle prompts</h3>
        <ul className="mt-3 space-y-3 text-sm text-[var(--ink-800)]">
          {lifePrompts.map((prompt) => (
            <li key={prompt} className="rounded-xl bg-white/80 p-3">
              {prompt}
            </li>
          ))}
        </ul>

        {isAuthenticated ? (
          <>
            <div className="mt-5 rounded-xl border border-[var(--ink-300)] bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-600)]">Library</p>
              <p className="mt-2 text-sm text-[var(--ink-700)]">
                Your saved compositions live here. Open past work, export it, or organize it when you need to.
              </p>
              {memorySnapshot ? (
                <>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-white/85 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">Weekly recap</p>
                      <p className="mt-2 text-sm text-[var(--ink-800)]">{memorySnapshot.weeklyRecap.summary}</p>
                    </div>
                    <div className="rounded-xl bg-white/85 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">Monthly recap</p>
                      <p className="mt-2 text-sm text-[var(--ink-800)]">{memorySnapshot.monthlyRecap.summary}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-white/85 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">Recurring moods</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {memorySnapshot.recurringMoods.length > 0 ? memorySnapshot.recurringMoods.map((item) => (
                          <span key={item.mood} className="rounded-full bg-[var(--sand-50)] px-3 py-1 text-xs text-[var(--ink-800)]">
                            {item.mood} × {item.count}
                          </span>
                        )) : <span className="text-xs text-[var(--ink-600)]">Not enough history yet.</span>}
                      </div>
                    </div>
                    <div className="rounded-xl bg-white/85 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">Recurring themes</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {memorySnapshot.recurringThemes.length > 0 ? memorySnapshot.recurringThemes.map((item) => (
                          <span key={item.theme} className="rounded-full bg-[var(--sand-50)] px-3 py-1 text-xs text-[var(--ink-800)]">
                            {item.theme} × {item.count}
                          </span>
                        )) : <span className="text-xs text-[var(--ink-600)]">Themes will appear as you write more.</span>}
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
              <div className="mt-3 space-y-2">
                {isHistoryLoading ? <p className="text-sm text-[var(--ink-700)]">Loading history...</p> : null}
                {!isHistoryLoading && compositions.length === 0 ? <p className="text-sm text-[var(--ink-700)]">No saved compositions yet.</p> : null}
                {compositions.slice(0, 4).map((item) => (
                  <div key={item.id} className="rounded-xl border border-[var(--ink-300)] bg-white/80 p-3">
                    <p className="text-xs uppercase tracking-[0.1em] text-[var(--ink-500)]">
                      {item.mode} - {item.mood} - {formatDate(item.created_at)}
                    </p>
                    <p className="mt-1 font-semibold text-[var(--ink-900)]">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--ink-700)]">{item.excerpt}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" onClick={() => onOpenHistoryItem(item)}>Open</Button>
                      <Button size="sm" variant="secondary" disabled={activeExportId === item.id} onClick={() => onExportComposition(item.id, "markdown")}>
                        {activeExportId === item.id ? "Exporting..." : "Export .md"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-[var(--ink-300)] bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-600)]">Memory retrieval</p>
              <p className="mt-2 text-sm text-[var(--ink-700)]">
                Ask Journa about a feeling, topic, or recurring concern to surface relevant writing.
              </p>
              <div className="mt-3 flex gap-2">
                <input
                  value={retrievalQuery}
                  onChange={(event) => setRetrievalQuery(event.target.value)}
                  className="h-10 flex-1 rounded-xl border border-[var(--ink-300)] bg-white/90 px-3 text-sm"
                  placeholder='Try: "loneliness", "ambition", "family", or "when did I feel hopeful?"'
                />
                <Button size="sm" variant="secondary" onClick={onRetrieve} disabled={isRetrievalLoading}>
                  {isRetrievalLoading ? "Searching..." : "Search memory"}
                </Button>
              </div>
              {retrievalResults ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-white/85 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">Journal entries</p>
                    <div className="mt-2 space-y-2">
                      {retrievalResults.entries.length > 0 ? retrievalResults.entries.map((item) => (
                        <div key={item.id} className="rounded-xl border border-[var(--ink-300)] bg-white p-3">
                          <p className="text-sm font-semibold text-[var(--ink-900)]">{item.title}</p>
                          <p className="mt-1 text-xs text-[var(--ink-600)]">{item.mood} · {formatDate(item.created_at)}</p>
                          <p className="mt-2 text-sm text-[var(--ink-700)]">{item.snippet}</p>
                          <p className="mt-2 text-xs text-[var(--ink-500)]">{item.whyRelated}</p>
                        </div>
                      )) : <p className="text-sm text-[var(--ink-600)]">No matching entries yet.</p>}
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/85 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">Reflections & compositions</p>
                    <div className="mt-2 space-y-2">
                      {retrievalResults.compositions.length > 0 ? retrievalResults.compositions.map((item) => (
                        <div key={item.id} className="rounded-xl border border-[var(--ink-300)] bg-white p-3">
                          <p className="text-sm font-semibold text-[var(--ink-900)]">{item.title}</p>
                          <p className="mt-1 text-xs text-[var(--ink-600)]">{item.mode} · {item.mood} · {formatDate(item.created_at)}</p>
                          <p className="mt-2 text-sm text-[var(--ink-700)]">{item.snippet}</p>
                          <p className="mt-2 text-xs text-[var(--ink-500)]">{item.whyRelated}</p>
                        </div>
                      )) : <p className="text-sm text-[var(--ink-600)]">No matching reflections yet.</p>}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {memorySnapshot?.reflectionMoments?.length ? (
              <div className="mt-5 rounded-xl border border-[var(--ink-300)] bg-white/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-600)]">Recent reflection signals</p>
                <div className="mt-3 space-y-3">
                  {memorySnapshot.reflectionMoments.map((item) => (
                    <div key={item.id} className="rounded-xl bg-white/85 p-3">
                      <p className="text-sm font-semibold text-[var(--ink-900)]">{item.title}</p>
                      <p className="mt-1 text-xs text-[var(--ink-600)]">{item.mode} · {item.mood} · {formatDate(item.created_at)}</p>
                      <p className="mt-2 text-sm text-[var(--ink-700)]">{item.reflection.whatMattered}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <details className="mt-5 rounded-xl border border-[var(--ink-300)] bg-white/70 p-4">
              <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-600)]">
                Advanced workspace
              </summary>
              <p className="mt-2 text-sm text-[var(--ink-700)]">
                Async jobs, sharing, and collections are still here — just moved out of the critical first-use path.
              </p>

              <div className="mt-4 rounded-xl border border-[var(--ink-300)] bg-white/80 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-600)]">Async compose jobs</p>
                  <Button size="sm" variant="secondary" onClick={onLoadComposeJobs} disabled={isComposeJobsLoading}>
                    {isComposeJobsLoading ? "Refreshing..." : "Refresh"}
                  </Button>
                </div>
                <div className="mt-2 space-y-2">
                  {isComposeJobsLoading ? <p className="text-sm text-[var(--ink-700)]">Loading compose jobs...</p> : null}
                  {!isComposeJobsLoading && composeJobs.length === 0 ? (
                    <p className="text-sm text-[var(--ink-700)]">No async jobs yet. Generate a draft to queue one.</p>
                  ) : null}
                  {composeJobs.slice(0, 6).map((job) => (
                    <div key={job.id} className="rounded-xl border border-[var(--ink-300)] bg-white p-3">
                      <p className="text-xs uppercase tracking-[0.1em] text-[var(--ink-500)]">
                        {job.status} - attempt {job.attempt_count}/{job.max_attempts} - {formatDate(job.created_at)}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[var(--ink-900)]">{job.composition?.title ?? "Pending composition output"}</p>
                      {job.last_error ? <p className="mt-1 text-xs text-red-700">{job.last_error}</p> : null}
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" variant="secondary" disabled={job.status !== "completed"} onClick={() => onOpenComposeJobItem(job)}>
                          Open Result
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-[var(--ink-300)] bg-white/80 p-3">
                <p className="inline-flex items-center text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-700)]">
                  <History className="mr-2 h-3.5 w-3.5" /> Sharing & collections
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <input value={collectionTitle} onChange={(event) => setCollectionTitle(event.target.value)} className="h-10 rounded-xl border border-[var(--ink-300)] bg-white/90 px-3 text-sm" placeholder="New collection title" />
                  <input value={collectionDescription} onChange={(event) => setCollectionDescription(event.target.value)} className="h-10 rounded-xl border border-[var(--ink-300)] bg-white/90 px-3 text-sm" placeholder="Optional description" />
                  <select value={selectedCollectionId} onChange={(event) => setSelectedCollectionId(event.target.value)} className="h-10 rounded-xl border border-[var(--ink-300)] bg-white/90 px-3 text-sm">
                    <option value="">Select collection</option>
                    {collections.map((collection) => (
                      <option key={collection.id} value={collection.id}>{collection.title}</option>
                    ))}
                  </select>
                  <label className="inline-flex items-center gap-2 rounded-xl border border-[var(--ink-300)] bg-white/90 px-3 text-sm">
                    <input type="checkbox" checked={collectionIsPublic} onChange={(event) => setCollectionIsPublic(event.target.checked)} />
                    Public collection
                  </label>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
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
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={onCreateCollection} disabled={activeCollectionId === "create"}>
                    {activeCollectionId === "create" ? "Creating..." : "Create Collection"}
                  </Button>
                  {selectedCollectionId ? (
                    <a className="inline-flex h-9 items-center rounded-full bg-[var(--sand-100)] px-4 text-xs font-semibold text-[var(--ink-800)]" href={`/collections/${collections.find((item) => item.id === selectedCollectionId)?.slug ?? ""}`} target="_blank" rel="noreferrer">
                      Open Collection
                    </a>
                  ) : null}
                  {isCollectionsLoading ? <span className="inline-flex h-9 items-center text-xs text-[var(--ink-600)]">Syncing collections...</span> : null}
                </div>
                <div className="mt-3 space-y-2">
                  {isSharesLoading ? <p className="text-sm text-[var(--ink-700)]">Loading share analytics...</p> : null}
                  {compositions.slice(0, 6).map((item) => {
                    const latestShare = findLatestShareForComposition(item.id);
                    return (
                      <div key={item.id} className="rounded-xl border border-[var(--ink-300)] bg-white p-3">
                        <p className="text-xs uppercase tracking-[0.1em] text-[var(--ink-500)]">{item.title}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Button size="sm" variant="secondary" disabled={!selectedCollectionId || activeCollectionId === item.id} onClick={() => onAddToCollection(item.id)}>
                            {activeCollectionId === item.id ? "Adding..." : "Add to Collection"}
                          </Button>
                          <Button size="sm" variant="secondary" disabled={activeShareId === item.id} onClick={() => onCreateShareLink(item.id)}>
                            {activeShareId === item.id ? "Sharing..." : "Copy Link"}
                          </Button>
                          <Button size="sm" variant="secondary" disabled={activeExportId === item.id} onClick={() => onExportComposition(item.id, "text")}>
                            {activeExportId === item.id ? "Exporting..." : "Export .txt"}
                          </Button>
                          {latestShare ? (
                            <Button size="sm" variant="secondary" disabled={activeRevokeShareId === latestShare.id} onClick={() => onRevokeShare(latestShare.id)}>
                              {activeRevokeShareId === latestShare.id ? "Revoking..." : "Revoke Link"}
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {shareStatus ? <p className="mt-3 text-xs text-emerald-700">{shareStatus}</p> : null}
              </div>
            </details>
          </>
        ) : (
          <div className="mt-5 rounded-xl bg-[var(--ink-950)] p-4 text-[var(--sand-50)]">
            <p className="text-xs tracking-[0.08em] uppercase">Output preview</p>
            <p className="mt-2 text-sm leading-relaxed">
              {result?.excerpt ?? "Your refined draft appears here with edit notes and structure."}
            </p>
          </div>
        )}
      </Card>
    </section>
  );
}
