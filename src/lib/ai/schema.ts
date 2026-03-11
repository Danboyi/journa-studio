import { z } from "zod";

import type { NarrativeMood, StylePreset, WritingMode } from "@/types/journa";

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

const stylePresets: StylePreset[] = [
  "balanced",
  "cinematic",
  "academic",
  "minimalist",
  "soulful",
];

export const composeRequestSchema = z.object({
  mode: z.enum(modes),
  mood: z.enum(moods),
  voiceNotes: z.string().min(5).max(8000),
  sourceText: z.string().min(10).max(15000),
  stylePreset: z.enum(stylePresets).optional().default("balanced"),
  persist: z.boolean().optional().default(true),
});

export const reflectionPayloadSchema = z.object({
  summary: z.string().min(10),
  whatMattered: z.string().min(10),
  beneathTheSurface: z.string().min(10),
  followUpQuestion: z.string().min(10),
});

export const composeResponseSchema = z.object({
  title: z.string().min(2),
  excerpt: z.string().min(10),
  draft: z.string().min(50),
  editorialNotes: z.array(z.string().min(3)).min(1),
  reflection: reflectionPayloadSchema.optional(),
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
    reflection: {
      type: "object",
      additionalProperties: false,
      required: ["summary", "whatMattered", "beneathTheSurface", "followUpQuestion"],
      properties: {
        summary: { type: "string", minLength: 10, maxLength: 240 },
        whatMattered: { type: "string", minLength: 10, maxLength: 240 },
        beneathTheSurface: { type: "string", minLength: 10, maxLength: 240 },
        followUpQuestion: { type: "string", minLength: 10, maxLength: 240 },
      },
    },
  },
} as const;

export const createShareSchema = z.object({
  compositionId: z.uuid(),
  expiresInDays: z.number().int().min(1).max(365).optional().default(30),
  password: z.string().min(4).max(100).optional(),
});

export const exportCompositionSchema = z.object({
  compositionId: z.uuid(),
  format: z.enum(["markdown", "text"]).default("markdown"),
});

export type ComposeRequestInput = Omit<z.infer<typeof composeRequestSchema>, "persist">;
export type ComposeRequestPayload = z.infer<typeof composeRequestSchema>;
export type ComposeResponseOutput = z.infer<typeof composeResponseSchema>;
