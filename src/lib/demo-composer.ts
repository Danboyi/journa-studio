import { ComposeRequest, ComposeResponse } from "@/types/journa";

export function composeDraft(input: ComposeRequest): ComposeResponse {
  const descriptor = input.mode.replaceAll("-", " ");

  return {
    title: `A ${input.mood} ${descriptor} in your voice`,
    excerpt:
      "You wrote this in plain language. Journa refined structure, rhythm, and imagery while preserving your tone.",
    draft: [
      "You did not arrive at this page as a character. You arrived as a person with receipts: sharp mornings, delayed answers, unfinished courage.",
      "",
      `In ${descriptor} form, your truth does not need decoration to matter. It needs arrangement. So we keep your words close, then give them shape: an opening that breathes, a middle that reveals, and an ending that lingers.`,
      "",
      `Tonight, the tone leans ${input.mood}. Not because life is one note, but because this note is the one that asked to be heard first.`,
      "",
      "You are not rewriting your life. You are finally reading it with intention.",
    ].join("\n"),
    editorialNotes: [
      "Preserved first-person perspective and conversational rhythm.",
      "Introduced narrative transitions for stronger flow.",
      "Added controlled metaphor density to maintain authenticity.",
    ],
  };
}

