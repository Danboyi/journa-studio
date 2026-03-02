import { z } from "zod";

import { composeRequestSchema, type ComposeRequestInput } from "@/lib/ai/schema";

export const composeJobPayloadSchema = composeRequestSchema
  .omit({ persist: true })
  .extend({
    stylePreset: composeRequestSchema.shape.stylePreset.default("balanced"),
  });

export const enqueueComposeJobSchema = composeJobPayloadSchema.extend({
  maxAttempts: z.number().int().min(1).max(10).optional().default(3),
});

export type ComposeJobPayload = z.infer<typeof composeJobPayloadSchema>;
export type EnqueueComposeJobInput = z.infer<typeof enqueueComposeJobSchema>;

export type ComposeJobStatus = "queued" | "processing" | "completed" | "failed";

export function calculateRetryDelayMs(attemptCount: number) {
  const baseMs = 15_000;
  const cappedAttempt = Math.max(1, Math.min(6, attemptCount));
  return baseMs * 2 ** (cappedAttempt - 1);
}

export function payloadToComposeInput(payload: ComposeJobPayload): ComposeRequestInput {
  return {
    mode: payload.mode,
    mood: payload.mood,
    sourceText: payload.sourceText,
    voiceNotes: payload.voiceNotes,
    stylePreset: payload.stylePreset,
  };
}
