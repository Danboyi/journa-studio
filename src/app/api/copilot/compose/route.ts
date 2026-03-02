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
import { attachRequestId, beginRequest, endRequest, failRequest } from "@/lib/telemetry";
import { reserveDailyUsage } from "@/lib/usage-guardrails";

export async function POST(request: NextRequest) {
  const trace = beginRequest(request, "api.copilot.compose");

  try {
    const ip = getRequestIp(request);
    const ipLimit = await enforceRateLimit(`compose:ip:${ip}`, { limit: 30, windowMs: 60_000 });

    if (!ipLimit.allowed) {
      failRequest(trace, 429, "compose_ip_rate_limited");
      return rateLimitResponse(
        "Too many compose requests. Slow down and retry.",
        ipLimit.retryAfterSeconds,
        trace.requestId,
      );
    }

    const json = await request.json();
    const parsed = composeRequestSchema.safeParse(json);

    if (!parsed.success) {
      failRequest(trace, 400, "invalid_compose_body");
      const response = NextResponse.json(
        { error: "Invalid request body", issues: parsed.error.issues },
        { status: 400 },
      );
      return attachRequestId(response, trace.requestId);
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

          const userLimit = await enforceRateLimit(`compose:user:${user.id}`, {
            limit: 60,
            windowMs: 60_000,
          });

          if (!userLimit.allowed) {
            failRequest(trace, 429, "compose_user_rate_limited", { user_id: user.id });
            return rateLimitResponse(
              "Compose rate limit reached for your account.",
              userLimit.retryAfterSeconds,
              trace.requestId,
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
            failRequest(trace, 429, "compose_daily_budget_exceeded", { user_id: user.id, units });
            const response = NextResponse.json({ error: budgetCheck.reason }, { status: 429 });
            return attachRequestId(response, trace.requestId);
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

    const response = NextResponse.json(output);
    endRequest(trace, 200, { persisted: Boolean(persist && userId) });
    return attachRequestId(response, trace.requestId);
  } catch (error) {
    failRequest(trace, 500, "compose_unhandled_error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    const response = NextResponse.json({ error: "Internal server error." }, { status: 500 });
    return attachRequestId(response, trace.requestId);
  }
}
