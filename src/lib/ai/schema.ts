import { z } from "zod";

import type { NarrativeMood, WritingMode } from "@/types/journa";

const moods: NarrativeMood[] = [
  "funny",
  "serious",
  "sad",
  "sorrowful",
  "horror",
  "suspense",
  "soul-piercing",
];

const modes: WritingMode[] = [
  "daily-journal",
  "story",
  "essay",
  "statement-of-purpose",
  "biography",
  "autobiography",
  "life-documentation",
];

export const composeRequestSchema = z.object({
  mode: z.enum(modes),
  mood: z.enum(moods),
  voiceNotes: z.string().min(5).max(8000),
  sourceText: z.string().min(10).max(15000),
});

export const composeResponseSchema = z.object({
  title: z.string().min(2),
  excerpt: z.string().min(10),
  draft: z.string().min(50),
  editorialNotes: z.array(z.string().min(3)).min(1),
});

export const composeResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "excerpt", "draft", "editorialNotes"],
  properties: {
    title: {
      type: "string",
      minLength: 2,
      maxLength: 120,
    },
    excerpt: {
      type: "string",
      minLength: 10,
      maxLength: 280,
    },
    draft: {
      type: "string",
      minLength: 50,
    },
    editorialNotes: {
      type: "array",
      minItems: 1,
      maxItems: 6,
      items: {
        type: "string",
        minLength: 3,
      },
    },
  },
} as const;

export type ComposeRequestInput = z.infer<typeof composeRequestSchema>;
export type ComposeResponseOutput = z.infer<typeof composeResponseSchema>;
