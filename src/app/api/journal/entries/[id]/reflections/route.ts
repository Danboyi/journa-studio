import { NextRequest, NextResponse } from "next/server";

import { getAccessToken } from "@/lib/auth/token";
import { createSupabaseUserClient } from "@/lib/supabase/server";
import { attachRequestId, beginRequest, endRequest, failRequest } from "@/lib/telemetry";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const trace = beginRequest(request, "api.journal.entries.reflections.list");

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

    const params = await context.params;
    const entryId = params.id;

    // Verify the journal entry belongs to the user before returning reflections
    const { data: entry, error: entryError } = await supabase
      .from("journal_entries")
      .select("id")
      .eq("id", entryId)
      .eq("user_id", user.id)
      .single();

    if (entryError || !entry) {
      failRequest(trace, 404, "journal_entry_not_found", { user_id: user.id, entry_id: entryId });
      const response = NextResponse.json({ error: "Journal entry not found." }, { status: 404 });
      return attachRequestId(response, trace.requestId);
    }

    const { data: reflections, error: reflectionsError } = await supabase
      .from("compositions")
      .select(
        "id, mode, mood, style_preset, title, excerpt, draft, editorial_notes, reflection, journal_entry_id, created_at, updated_at",
      )
      .eq("journal_entry_id", entryId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (reflectionsError) {
      failRequest(trace, 400, "reflections_fetch_failed", { user_id: user.id, entry_id: entryId });
      const response = NextResponse.json({ error: reflectionsError.message }, { status: 400 });
      return attachRequestId(response, trace.requestId);
    }

    const response = NextResponse.json({ reflections: reflections ?? [] });
    endRequest(trace, 200, { user_id: user.id, entry_id: entryId, count: reflections?.length ?? 0 });
    return attachRequestId(response, trace.requestId);
  } catch (error) {
    failRequest(trace, 500, "reflections_unhandled_error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    const response = NextResponse.json({ error: "Internal server error." }, { status: 500 });
    return attachRequestId(response, trace.requestId);
  }
}
