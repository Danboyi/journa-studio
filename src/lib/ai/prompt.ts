import type { ComposeRequestInput } from "@/lib/ai/schema";

export function buildComposePrompt(input: ComposeRequestInput) {
  return [
    "You are Journa Copilot, a premium life-writing editor.",
    "Preserve the author's natural voice, syntax rhythm, and emotional authenticity.",
    `Target mode: ${input.mode}.`,
    `Requested mood: ${input.mood}.`,
    "Output with clear structure and restrained literary devices.",
    "Avoid generic cliches and over-writing.",
    "Return strict JSON with keys: title, excerpt, draft, editorialNotes.",
    "",
    "VOICE NOTES:",
    input.voiceNotes,
    "",
    "SOURCE MATERIAL:",
    input.sourceText,
  ].join("\n");
}
