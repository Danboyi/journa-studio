import { NextRequest, NextResponse } from "next/server";

import { getComposeProvider } from "@/lib/ai/provider";
import { composeRequestSchema } from "@/lib/ai/schema";
import { getAccessToken } from "@/lib/auth/token";
import {
  enforceRateLimit,
  getRequestIp,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { createSupabaseUserClient } from "@/lib/supabase/server";
import { reserveDailyUsage } from "@/lib/usage-guardrails";

export async function POST(request: NextRequest) {
  const ip = getRequestIp(request);
  const ipLimit = enforceRateLimit(`compose:ip:${ip}`, { limit: 30, windowMs: 60_000 });

  if (!ipLimit.allowed) {
    return rateLimitResponse("Too many compose requests. Slow down and retry.", ipLimit.retryAfterSeconds);
  }

  const json = await request.json();
  const parsed = composeRequestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { persist, ...composeInput } = parsed.data;
  const accessToken = getAccessToken(request);

  let userId: string | null = null;
  let supabaseClient: ReturnType<typeof createSupabaseUserClient> = null;

  if (accessToken) {
    supabaseClient = createSupabaseUserClient(accessToken);

    if (supabaseClient) {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();

      if (user) {
        userId = user.id;

        const userLimit = enforceRateLimit(`compose:user:${user.id}`, {
          limit: 60,
          windowMs: 60_000,
        });

        if (!userLimit.allowed) {
          return rateLimitResponse(
            "Compose rate limit reached for your account.",
            userLimit.retryAfterSeconds,
          );
        }

        const units = composeInput.sourceText.length + composeInput.voiceNotes.length;
        const budgetCheck = await reserveDailyUsage(supabaseClient, {
          userId: user.id,
          endpoint: "compose",
          units,
          dailyLimit: 120_000,
        });

        if (!budgetCheck.allowed) {
          return NextResponse.json({ error: budgetCheck.reason }, { status: 429 });
        }
      }
    }
  }

  const provider = getComposeProvider();
  const output = await provider.compose(composeInput);

  if (persist && userId && supabaseClient) {
    await supabaseClient.from("compositions").insert({
      user_id: userId,
      mode: composeInput.mode,
      mood: composeInput.mood,
      style_preset: composeInput.stylePreset ?? "balanced",
      source_text: composeInput.sourceText,
      voice_notes: composeInput.voiceNotes,
      title: output.title,
      excerpt: output.excerpt,
      draft: output.draft,
      editorial_notes: output.editorialNotes,
    });
  }

  return NextResponse.json(output);
}
