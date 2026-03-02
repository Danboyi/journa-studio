import { NextRequest, NextResponse } from "next/server";

import { getComposeProvider } from "@/lib/ai/provider";
import { composeRequestSchema } from "@/lib/ai/schema";
import { getAccessToken } from "@/lib/auth/token";
import { createSupabaseUserClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const json = await request.json();
  const parsed = composeRequestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { persist, ...composeInput } = parsed.data;
  const provider = getComposeProvider();
  const output = await provider.compose(composeInput);

  if (persist) {
    const accessToken = getAccessToken(request);

    if (accessToken) {
      const supabase = createSupabaseUserClient(accessToken);

      if (supabase) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          await supabase.from("compositions").insert({
            user_id: user.id,
            mode: composeInput.mode,
            mood: composeInput.mood,
            source_text: composeInput.sourceText,
            voice_notes: composeInput.voiceNotes,
            title: output.title,
            excerpt: output.excerpt,
            draft: output.draft,
            editorial_notes: output.editorialNotes,
          });
        }
      }
    }
  }

  return NextResponse.json(output);
}
