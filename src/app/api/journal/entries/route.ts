import { NextRequest, NextResponse } from "next/server";

import { createEntrySchema } from "@/lib/auth/schema";
import { getAccessToken } from "@/lib/auth/token";
import { createSupabaseUserClient } from "@/lib/supabase/server";
import { attachRequestId, beginRequest, endRequest, failRequest } from "@/lib/telemetry";

export async function GET(request: NextRequest) {
  const trace = beginRequest(request, "api.journal.entries.list");

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

    const { data, error } = await supabase
      .from("journal_entries")
      .select("id, headline, body, mood, entry_type, refined_body, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      failRequest(trace, 400, "entries_query_failed");
      const response = NextResponse.json({ error: error.message }, { status: 400 });
      return attachRequestId(response, trace.requestId);
    }

    const response = NextResponse.json({ entries: data });
    endRequest(trace, 200, { entries_count: data?.length ?? 0 });
    return attachRequestId(response, trace.requestId);
  } catch (error) {
    failRequest(trace, 500, "entries_get_unhandled_error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    const response = NextResponse.json({ error: "Internal server error." }, { status: 500 });
    return attachRequestId(response, trace.requestId);
  }
}

export async function POST(request: NextRequest) {
  const trace = beginRequest(request, "api.journal.entries.create");

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

    const json = await request.json();
    const parsed = createEntrySchema.safeParse(json);

    if (!parsed.success) {
      failRequest(trace, 400, "invalid_entry_body", { user_id: user.id });
      const response = NextResponse.json(
        { error: "Invalid request body.", issues: parsed.error.issues },
        { status: 400 },
      );
      return attachRequestId(response, trace.requestId);
    }

    const { data, error } = await supabase
      .from("journal_entries")
      .insert({
        user_id: user.id,
        headline: parsed.data.headline || "",
        body: parsed.data.body,
        mood: parsed.data.mood,
        entry_type: parsed.data.entryType,
      })
      .select("id, headline, body, mood, entry_type, refined_body, created_at, updated_at")
      .single();

    if (error) {
      failRequest(trace, 400, "entry_insert_failed", { user_id: user.id });
      const response = NextResponse.json({ error: error.message }, { status: 400 });
      return attachRequestId(response, trace.requestId);
    }

    const response = NextResponse.json({ entry: data }, { status: 201 });
    endRequest(trace, 201, { user_id: user.id, entry_id: data.id });
    return attachRequestId(response, trace.requestId);
  } catch (error) {
    failRequest(trace, 500, "entries_post_unhandled_error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    const response = NextResponse.json({ error: "Internal server error." }, { status: 500 });
    return attachRequestId(response, trace.requestId);
  }
}
