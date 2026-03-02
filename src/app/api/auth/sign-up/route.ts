import { NextRequest, NextResponse } from "next/server";

import { setSessionCookie } from "@/lib/auth/cookie";
import { enforceRateLimit, getRequestIp, rateLimitResponse } from "@/lib/rate-limit";
import { signUpSchema } from "@/lib/auth/schema";
import { createSupabaseAnonClient } from "@/lib/supabase/server";
import { attachRequestId, beginRequest, endRequest, failRequest } from "@/lib/telemetry";

export async function POST(request: NextRequest) {
  const trace = beginRequest(request, "api.auth.signup");

  try {
    const ip = getRequestIp(request);
    const limit = await enforceRateLimit(`auth:signup:${ip}`, { limit: 8, windowMs: 60_000 });

    if (!limit.allowed) {
      failRequest(trace, 429, "signup_rate_limited");
      return rateLimitResponse(
        "Too many sign-up attempts. Please wait and retry.",
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
    const parsed = signUpSchema.safeParse(json);

    if (!parsed.success) {
      failRequest(trace, 400, "invalid_signup_body");
      const response = NextResponse.json(
        { error: "Invalid request body.", issues: parsed.error.issues },
        { status: 400 },
      );
      return attachRequestId(response, trace.requestId);
    }

    const { email, password, fullName } = parsed.data;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      failRequest(trace, 400, "signup_failed");
      const response = NextResponse.json({ error: error.message }, { status: 400 });
      return attachRequestId(response, trace.requestId);
    }

    const response = NextResponse.json({
      user: data.user,
      needsEmailConfirmation: !data.session,
    });

    if (data.session?.access_token) {
      setSessionCookie(response, data.session.access_token);
    }

    endRequest(trace, 200, { user_id: data.user?.id ?? null });
    return attachRequestId(response, trace.requestId);
  } catch (error) {
    failRequest(trace, 500, "signup_unhandled_error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    const response = NextResponse.json({ error: "Internal server error." }, { status: 500 });
    return attachRequestId(response, trace.requestId);
  }
}
