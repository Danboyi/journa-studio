import { ComposeRequest, ComposeResponse } from "@/types/journa";

function buildReflectionDraft(input: ComposeRequest) {
  return [
    "Here is the clearer version of what your entry seems to be saying:",
    "",
    "Something in this moment mattered enough to be written down, even if it first arrived in fragments.",
    "The value of the note is not that it sounds polished. The value is that it captures what was true when you were living it.",
    "",
    `Journa reads the emotional center as ${input.mood}, but not in a one-note way. There is a surface event, and then there is the feeling underneath it — the part that asks to be understood, not just recorded.`,
    "",
    "So the work here is gentle: keep the voice, reduce the noise, and make the meaning easier to see when you come back later.",
  ].join("\n");
}

function buildTransformDraft(input: ComposeRequest, descriptor: string) {
  return [
    `In ${descriptor} form, your original truth does not need to be replaced. It needs shape.`,
    "",
    "Journa keeps the living texture of your language, then strengthens structure, movement, and clarity so the piece can carry more weight without losing your voice.",
    "",
    `The resulting piece leans ${input.mood}, not for drama's sake, but because that emotional note is the one most present in the material you gave it.`,
    "",
    "This is not generic rewriting. It is narrative refinement with your humanity still visible in the grain.",
  ].join("\n");
}

export function composeDraft(input: ComposeRequest): ComposeResponse {
  const descriptor = input.mode.replaceAll("-", " ");
  const isReflectionMode = input.mode === "daily-journal" || input.mode === "essay";

  return {
    title: isReflectionMode ? "A clearer reading of what you meant" : `A ${input.mood} ${descriptor} in your voice`,
    excerpt: isReflectionMode
      ? "Journa reflected the emotional center of your note, clarified the meaning, and kept the writing close to your natural tone."
      : "Journa preserved your tone, then shaped the material into a more structured and readable piece.",
    draft: isReflectionMode ? buildReflectionDraft(input) : buildTransformDraft(input, descriptor),
    editorialNotes: isReflectionMode
      ? [
          "Preserved the original emotional signal instead of over-rewriting it.",
          "Clarified meaning and structure for easier future recall.",
          "Kept the tone intimate, direct, and recognizably human.",
        ]
      : [
          "Preserved first-person perspective and conversational rhythm.",
          "Strengthened structure and readability without flattening voice.",
          "Adjusted pacing and phrasing to fit the requested output mode.",
        ],
  };
}

