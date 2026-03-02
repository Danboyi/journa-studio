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
}

export interface ComposeResponse {
  title: string;
  excerpt: string;
  draft: string;
  editorialNotes: string[];
}
