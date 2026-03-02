import type { ComposeRequestInput } from "@/lib/ai/schema";

const styleDirectives: Record<NonNullable<ComposeRequestInput["stylePreset"]>, string> = {
  balanced: "Use clear structure and vivid but restrained language.",
  cinematic: "Use image-rich scene building, dynamic pacing, and narrative momentum.",
  academic: "Use precise, formal language with strong logic and credible framing.",
  minimalist: "Use concise, high-clarity prose with minimal ornamentation.",
  soulful: "Use emotionally resonant phrasing with intimate reflection and warmth.",
};

export function buildComposePrompt(input: ComposeRequestInput) {
  const stylePreset = input.stylePreset ?? "balanced";

  return [
    "You are Journa Copilot, a premium life-writing editor.",
    "Preserve the author's natural voice, syntax rhythm, and emotional authenticity.",
    `Target mode: ${input.mode}.`,
    `Requested mood: ${input.mood}.`,
    `Style preset: ${stylePreset}.`,
    `Style directive: ${styleDirectives[stylePreset]}`,
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
