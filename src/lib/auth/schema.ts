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

const entryTypes = ["free-write", "check-in", "gratitude", "letter", "dream"] as const;

export const createEntrySchema = z.object({
  headline: z.string().max(140).optional().default(""),
  body: z.string().min(1).max(20000),
  mood: z.enum(moods),
  entryType: z.enum(entryTypes).optional().default("free-write"),
  shouldRefine: z.boolean().optional().default(false),
});
