import { NextRequest, NextResponse } from "next/server";

import { getAccessToken } from "@/lib/auth/token";
import { createSupabaseUserClient } from "@/lib/supabase/server";
import { attachRequestId, beginRequest, endRequest, failRequest } from "@/lib/telemetry";

export async function GET(request: NextRequest) {
  const trace = beginRequest(request, "api.journal.on-this-day");

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

    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    // Find entries from the same day in previous weeks/months/years
    // Uses PostgreSQL extract to match month + day across years
    const { data, error } = await supabase
      .from("journal_entries")
      .select("id, headline, body, mood, entry_type, created_at")
      .filter("created_at", "lt", new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString())
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      failRequest(trace, 400, "on_this_day_query_failed");
      const response = NextResponse.json({ error: error.message }, { status: 400 });
      return attachRequestId(response, trace.requestId);
    }

    // Filter for same month+day, or within last 7 days (1 week ago), 30 days (1 month ago)
    const memories: Array<{
      entry: (typeof data)[number];
      label: string;
    }> = [];

    for (const entry of data ?? []) {
      const entryDate = new Date(entry.created_at);
      const diffDays = Math.floor((now.getTime() - entryDate.getTime()) / 86400000);

      // Exactly 7 days ago
      if (diffDays === 7) {
        memories.push({ entry, label: "1 week ago" });
        continue;
      }

      // Exactly 30 days ago (± 1 day)
      if (diffDays >= 29 && diffDays <= 31) {
        memories.push({ entry, label: "1 month ago" });
        continue;
      }

      // Same month & day, different year
      if (
        entryDate.getMonth() + 1 === month &&
        entryDate.getDate() === day &&
        entryDate.getFullYear() < now.getFullYear()
      ) {
        const yearsAgo = now.getFullYear() - entryDate.getFullYear();
        memories.push({ entry, label: `${yearsAgo} year${yearsAgo > 1 ? "s" : ""} ago` });
        continue;
      }

      // Exactly 90 days ago (± 1 day)
      if (diffDays >= 89 && diffDays <= 91) {
        memories.push({ entry, label: "3 months ago" });
      }
    }

    const response = NextResponse.json({ memories: memories.slice(0, 5) });
    endRequest(trace, 200, { memories_count: memories.length });
    return attachRequestId(response, trace.requestId);
  } catch (error) {
    failRequest(trace, 500, "on_this_day_unhandled_error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    const response = NextResponse.json({ error: "Internal server error." }, { status: 500 });
    return attachRequestId(response, trace.requestId);
  }
}
