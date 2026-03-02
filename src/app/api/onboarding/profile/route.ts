import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAccessToken } from "@/lib/auth/token";
import { createSupabaseUserClient } from "@/lib/supabase/server";
import { attachRequestId, beginRequest, endRequest, failRequest } from "@/lib/telemetry";

const onboardingSchema = z.object({
  answers: z.array(
    z.object({
      question: z.string().min(5).max(300),
      answer: z.string().min(1).max(8000),
    }),
  ),
});

export async function POST(request: NextRequest) {
  const trace = beginRequest(request, "api.onboarding.profile");

  try {
    const accessToken = getAccessToken(request);

    if (!accessToken) {
      failRequest(trace, 401, "missing_session");
      const response = NextResponse.json({ error: "Missing session token." }, { status: 401 });
      return attachRequestId(response, trace.requestId);
    }

    const supabase = createSupabaseUserClient(accessToken);

    if (!supabase) {
      failRequest(trace, 503, "supabase_unconfigured");
      const response = NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
      return attachRequestId(response, trace.requestId);
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      failRequest(trace, 401, "invalid_session");
      const response = NextResponse.json({ error: "Invalid session." }, { status: 401 });
      return attachRequestId(response, trace.requestId);
    }

    const json = await request.json();
    const parsed = onboardingSchema.safeParse(json);

    if (!parsed.success) {
      failRequest(trace, 400, "invalid_onboarding_body", { user_id: user.id });
      const response = NextResponse.json(
        { error: "Invalid request body.", issues: parsed.error.issues },
        { status: 400 },
      );
      return attachRequestId(response, trace.requestId);
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        onboarding_profile: parsed.data.answers,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      failRequest(trace, 400, "onboarding_update_failed", { user_id: user.id });
      const response = NextResponse.json({ error: error.message }, { status: 400 });
      return attachRequestId(response, trace.requestId);
    }

    const response = NextResponse.json({ ok: true });
    endRequest(trace, 200, { user_id: user.id, answers_count: parsed.data.answers.length });
    return attachRequestId(response, trace.requestId);
  } catch (error) {
    failRequest(trace, 500, "onboarding_unhandled_error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    const response = NextResponse.json({ error: "Internal server error." }, { status: 500 });
    return attachRequestId(response, trace.requestId);
  }
}
