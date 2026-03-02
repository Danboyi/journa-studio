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
  persist?: boolean;
}

export interface ComposeResponse {
  title: string;
  excerpt: string;
  draft: string;
  editorialNotes: string[];
}

export interface JournalEntry {
  id: string;
  headline: string;
  body: string;
  mood: NarrativeMood;
  refined_body: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompositionHistoryItem {
  id: string;
  mode: WritingMode;
  mood: NarrativeMood;
  source_text: string;
  voice_notes: string;
  title: string;
  excerpt: string;
  draft: string;
  editorial_notes: string[];
  created_at: string;
  updated_at: string;
}
