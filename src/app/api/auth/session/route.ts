import { NextRequest, NextResponse } from "next/server";

import { getAccessToken } from "@/lib/auth/token";
import { createSupabaseUserClient } from "@/lib/supabase/server";
import { attachRequestId, beginRequest, endRequest, failRequest } from "@/lib/telemetry";

export async function GET(request: NextRequest) {
  const trace = beginRequest(request, "api.auth.session");

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

    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user) {
      failRequest(trace, 401, "invalid_or_expired_token");
      const response = NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
      return attachRequestId(response, trace.requestId);
    }

    const response = NextResponse.json({ user: data.user });
    endRequest(trace, 200, { user_id: data.user.id });
    return attachRequestId(response, trace.requestId);
  } catch (error) {
    failRequest(trace, 500, "session_unhandled_error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    const response = NextResponse.json({ error: "Internal server error." }, { status: 500 });
    return attachRequestId(response, trace.requestId);
  }
}
