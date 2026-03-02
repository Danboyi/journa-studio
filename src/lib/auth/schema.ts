import { z } from "zod";

const moods = [
  "funny",
  "serious",
  "sad",
  "sorrowful",
  "horror",
  "suspense",
  "soul-piercing",
] as const;

export const signUpSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(100),
  fullName: z.string().min(2).max(100).optional(),
});

export const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(100),
});

export const createEntrySchema = z.object({
  headline: z.string().min(2).max(140),
  body: z.string().min(5).max(20000),
  mood: z.enum(moods),
  shouldRefine: z.boolean().optional().default(false),
});
