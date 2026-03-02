import { NextRequest, NextResponse } from "next/server";

import { getAccessToken } from "@/lib/auth/token";
import { createSupabaseUserClient } from "@/lib/supabase/server";
import { attachRequestId, beginRequest, endRequest, failRequest } from "@/lib/telemetry";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> },
) {
  const trace = beginRequest(request, "api.copilot.compose.jobs.status");

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

    const { data: job, error: jobError } = await supabase
      .from("compose_jobs")
      .select(
        "id, status, attempt_count, max_attempts, next_run_at, started_at, completed_at, last_error, composition_id, created_at, updated_at",
      )
      .eq("id", params.jobId)
      .eq("user_id", user.id)
      .single();

    if (jobError || !job) {
      failRequest(trace, 404, "compose_job_not_found", { user_id: user.id, job_id: params.jobId });
      const response = NextResponse.json({ error: "Compose job not found." }, { status: 404 });
      return attachRequestId(response, trace.requestId);
    }

    let composition: {
      id: string;
      source_text: string;
      voice_notes: string;
      style_preset: string | null;
      title: string;
      excerpt: string;
      draft: string;
      editorial_notes: string[];
      mode: string;
      mood: string;
      created_at: string;
    } | null = null;

    if (job.composition_id) {
      const { data } = await supabase
        .from("compositions")
        .select(
          "id, source_text, voice_notes, style_preset, title, excerpt, draft, editorial_notes, mode, mood, created_at",
        )
        .eq("id", job.composition_id)
        .eq("user_id", user.id)
        .single();
      composition = data;
    }

    const response = NextResponse.json({ job, composition });
    endRequest(trace, 200, { user_id: user.id, job_id: job.id, status: job.status });
    return attachRequestId(response, trace.requestId);
  } catch (error) {
    failRequest(trace, 500, "compose_jobs_status_unhandled_error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    const response = NextResponse.json({ error: "Internal server error." }, { status: 500 });
    return attachRequestId(response, trace.requestId);
  }
}
