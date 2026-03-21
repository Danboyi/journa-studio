import { NextRequest, NextResponse } from "next/server";

import { getAccessToken } from "@/lib/auth/token";
import { createSupabaseUserClient } from "@/lib/supabase/server";
import { attachRequestId, beginRequest, endRequest, failRequest } from "@/lib/telemetry";

export async function GET(request: NextRequest) {
  const trace = beginRequest(request, "api.journal.streak");

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
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      failRequest(trace, 401, "invalid_session");
      const response = NextResponse.json({ error: "Invalid session." }, { status: 401 });
      return attachRequestId(response, trace.requestId);
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("current_streak, longest_streak, last_entry_date, total_entries")
      .eq("id", user.id)
      .single();

    if (error) {
      failRequest(trace, 400, "streak_query_failed");
      const response = NextResponse.json({ error: error.message }, { status: 400 });
      return attachRequestId(response, trace.requestId);
    }

    const today = new Date().toISOString().slice(0, 10);
    const lastEntry = data?.last_entry_date;

    // If last entry was before yesterday, streak is broken (show 0)
    let displayStreak = data?.current_streak ?? 0;
    if (lastEntry && lastEntry < new Date(new Date(today).getTime() - 86400000).toISOString().slice(0, 10)) {
      displayStreak = 0;
    }

    const response = NextResponse.json({
      streak: {
        currentStreak: displayStreak,
        longestStreak: data?.longest_streak ?? 0,
        lastEntryDate: lastEntry,
        totalEntries: data?.total_entries ?? 0,
        wroteToday: lastEntry === today,
      },
    });
    endRequest(trace, 200);
    return attachRequestId(response, trace.requestId);
  } catch (error) {
    failRequest(trace, 500, "streak_unhandled_error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    const response = NextResponse.json({ error: "Internal server error." }, { status: 500 });
    return attachRequestId(response, trace.requestId);
  }
}
