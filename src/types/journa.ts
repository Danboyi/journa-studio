export type NarrativeMood =
  | "funny"
  | "serious"
  | "sad"
  | "sorrowful"
  | "horror"
  | "suspense"
  | "soul-piercing";

export type WritingMode =
  | "daily-journal"
  | "story"
  | "essay"
  | "statement-of-purpose"
  | "biography"
  | "autobiography"
  | "life-documentation";

export type EntryType = "free-write" | "check-in" | "gratitude" | "letter" | "dream";

export type StylePreset =
  | "balanced"
  | "cinematic"
  | "academic"
  | "minimalist"
  | "soulful";

export interface DailyEntryInput {
  headline: string;
  body: string;
  mood: NarrativeMood;
  shouldRefine: boolean;
}

export interface ComposeRequest {
  mode: WritingMode;
  mood: NarrativeMood;
  voiceNotes: string;
  sourceText: string;
  stylePreset?: StylePreset;
  persist?: boolean;
}

export interface ReflectionPayload {
  summary: string;
  whatMattered: string;
  beneathTheSurface: string;
  followUpQuestion: string;
}

export interface ComposeResponse {
  title: string;
  excerpt: string;
  draft: string;
  editorialNotes: string[];
  reflection?: ReflectionPayload;
}

export interface JournalEntry {
  id: string;
  headline: string;
  body: string;
  mood: NarrativeMood;
  entry_type: EntryType;
  refined_body: string | null;
  created_at: string;
  updated_at: string;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastEntryDate: string | null;
  totalEntries: number;
}

export interface CompositionHistoryItem {
  id: string;
  mode: WritingMode;
  mood: NarrativeMood;
  style_preset: StylePreset | null;
  source_text: string;
  voice_notes: string;
  title: string;
  excerpt: string;
  draft: string;
  editorial_notes: string[];
  reflection: ReflectionPayload | null;
  created_at: string;
  updated_at: string;
}

export interface CompositionShareItem {
  id: string;
  token: string;
  composition_id: string;
  expires_at: string | null;
  is_revoked: boolean;
  password_protected: boolean;
  view_count: number;
  last_viewed_at: string | null;
  created_at: string;
}

export interface CollectionItem {
  id: string;
  composition_id: string;
  position: number;
}

export interface Collection {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  items: CollectionItem[] | null;
}

export interface ComposeJobItem {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  attempt_count: number;
  max_attempts: number;
  next_run_at: string;
  started_at: string | null;
  completed_at: string | null;
  last_error: string | null;
  composition_id: string | null;
  created_at: string;
  updated_at: string;
  composition: {
    id: string;
    title: string;
    excerpt: string;
    mode: WritingMode;
    mood: NarrativeMood;
    created_at: string;
  } | null;
}
