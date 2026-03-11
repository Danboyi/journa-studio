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
  setComposeInput: (updater: (prev: ComposeRequest) => ComposeRequest) => void;
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
  findLatestShareForComposition: (compositionId: string) => CompositionShareItem | null;
  formatDate: (value: string) => string;
};

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
    setComposeInput,
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
    findLatestShareForComposition,
    formatDate,
  } = props;

  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <Card className="p-5 sm:p-6">
        <h2 className="text-xl font-semibold text-[var(--ink-900)]">Copilot</h2>
        <p className="mt-1 text-sm text-[var(--ink-700)]">
          Start with reflection first, then shape your writing into something polished when you need to.
        </p>

        <div className="mt-4 rounded-2xl bg-[var(--sand-50)] p-4 text-sm text-[var(--ink-800)]">
          <p className="font-semibold text-[var(--ink-900)]">Recommended flow</p>
          <p className="mt-1 text-[var(--ink-700)]">
            Use Copilot to understand what you wrote before reaching for heavy transformation modes.
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
          {isComposeLoading ? "Thinking..." : "Reflect or rewrite"}
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
