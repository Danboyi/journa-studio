import { NextRequest, NextResponse } from "next/server";

import { clearSessionCookie, setSessionCookie } from "@/lib/auth/cookie";
import { enforceRateLimit, getRequestIp, rateLimitResponse } from "@/lib/rate-limit";
import { signInSchema } from "@/lib/auth/schema";
import { createSupabaseAnonClient } from "@/lib/supabase/server";
import { attachRequestId, beginRequest, endRequest, failRequest } from "@/lib/telemetry";

export async function POST(request: NextRequest) {
  const trace = beginRequest(request, "api.auth.signin");

  try {
    const ip = getRequestIp(request);
    const limit = await enforceRateLimit(`auth:signin:${ip}`, { limit: 12, windowMs: 60_000 });

    if (!limit.allowed) {
      failRequest(trace, 429, "signin_rate_limited");
      return rateLimitResponse(
        "Too many sign-in attempts. Please wait and retry.",
        limit.retryAfterSeconds,
        trace.requestId,
      );
    }

    const supabase = createSupabaseAnonClient();

    if (!supabase) {
      failRequest(trace, 503, "supabase_unconfigured");
      const response = NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
      return attachRequestId(response, trace.requestId);
    }

    const json = await request.json();
    const parsed = signInSchema.safeParse(json);

    if (!parsed.success) {
      failRequest(trace, 400, "invalid_signin_body");
      const response = NextResponse.json(
        { error: "Invalid request body.", issues: parsed.error.issues },
        { status: 400 },
      );
      return attachRequestId(response, trace.requestId);
    }

    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

    if (error || !data.user || !data.session?.access_token) {
      failRequest(trace, 401, "signin_failed");
      const fail = NextResponse.json(
        { error: error?.message ?? "Invalid credentials." },
        { status: 401 },
      );
      clearSessionCookie(fail);
      return attachRequestId(fail, trace.requestId);
    }

    const response = NextResponse.json({ user: data.user });
    setSessionCookie(response, data.session.access_token);
    endRequest(trace, 200, { user_id: data.user.id });
    return attachRequestId(response, trace.requestId);
  } catch (error) {
    failRequest(trace, 500, "signin_unhandled_error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    const response = NextResponse.json({ error: "Internal server error." }, { status: 500 });
    return attachRequestId(response, trace.requestId);
  }
}
