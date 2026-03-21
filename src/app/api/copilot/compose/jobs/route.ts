import { NextRequest, NextResponse } from "next/server";

import { enqueueComposeJobSchema } from "@/lib/compose-jobs";
import { getAccessToken } from "@/lib/auth/token";
import { enforceRateLimit, getRequestIp, rateLimitResponse } from "@/lib/rate-limit";
import { createSupabaseUserClient } from "@/lib/supabase/server";
import { attachRequestId, beginRequest, endRequest, failRequest } from "@/lib/telemetry";

export async function GET(request: NextRequest) {
  const trace = beginRequest(request, "api.copilot.compose.jobs.list");

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

    const { data: jobs, error: jobsError } = await supabase
      .from("compose_jobs")
      .select(
        "id, status, attempt_count, max_attempts, next_run_at, started_at, completed_at, last_error, composition_id, created_at, updated_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (jobsError) {
      failRequest(trace, 400, "compose_jobs_list_failed", { user_id: user.id });
      const response = NextResponse.json({ error: jobsError.message }, { status: 400 });
      return attachRequestId(response, trace.requestId);
    }

    const compositionIds = (jobs ?? [])
      .map((job) => job.composition_id)
      .filter((value): value is string => Boolean(value));

    let compositionsById: Record<
      string,
      { id: string; title: string; excerpt: string; mode: string; mood: string; reflection: unknown; created_at: string }
    > = {};

    if (compositionIds.length > 0) {
      const { data: compositions } = await supabase
        .from("compositions")
        .select("id, title, excerpt, mode, mood, reflection, created_at")
        .in("id", compositionIds)
        .eq("user_id", user.id);

      compositionsById = Object.fromEntries((compositions ?? []).map((item) => [item.id, item]));
    }

    const response = NextResponse.json({
      jobs: (jobs ?? []).map((job) => ({
        ...job,
        composition: job.composition_id ? compositionsById[job.composition_id] ?? null : null,
      })),
    });
    endRequest(trace, 200, { user_id: user.id, jobs_count: jobs?.length ?? 0 });
    return attachRequestId(response, trace.requestId);
  } catch (error) {
    failRequest(trace, 500, "compose_jobs_list_unhandled_error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    const response = NextResponse.json({ error: "Internal server error." }, { status: 500 });
    return attachRequestId(response, trace.requestId);
  }
}

export async function POST(request: NextRequest) {
  const trace = beginRequest(request, "api.copilot.compose.jobs.enqueue");

  try {
    const accessToken = getAccessToken(request);

    if (!accessToken) {
      failRequest(trace, 401, "missing_session");
      const response = NextResponse.json({ error: "Missing session token." }, { status: 401 });
      return attachRequestId(response, trace.requestId);
    }

    const ip = getRequestIp(request);
    const ipLimit = await enforceRateLimit(`compose:jobs:ip:${ip}`, { limit: 20, windowMs: 60_000 });

    if (!ipLimit.allowed) {
      failRequest(trace, 429, "compose_jobs_enqueue_ip_limited");
      return rateLimitResponse(
        "Too many compose job requests. Try again shortly.",
        ipLimit.retryAfterSeconds,
        trace.requestId,
      );
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

    const userLimit = await enforceRateLimit(`compose:jobs:user:${user.id}`, {
      limit: 40,
      windowMs: 60_000,
    });

    if (!userLimit.allowed) {
      failRequest(trace, 429, "compose_jobs_enqueue_user_limited", { user_id: user.id });
      return rateLimitResponse(
        "Compose job rate limit reached for your account.",
        userLimit.retryAfterSeconds,
        trace.requestId,
      );
    }

    const json = await request.json();
    const parsed = enqueueComposeJobSchema.safeParse(json);

    if (!parsed.success) {
      failRequest(trace, 400, "invalid_compose_job_body", { user_id: user.id });
      const response = NextResponse.json(
        { error: "Invalid request body.", issues: parsed.error.issues },
        { status: 400 },
      );
      return attachRequestId(response, trace.requestId);
    }

    const { maxAttempts, ...payload } = parsed.data;
    const { data, error } = await supabase
      .from("compose_jobs")
      .insert({
        user_id: user.id,
        status: "queued",
        payload,
        max_attempts: maxAttempts,
      })
      .select(
        "id, status, attempt_count, max_attempts, next_run_at, created_at, updated_at",
      )
      .single();

    if (error || !data) {
      failRequest(trace, 400, "compose_job_insert_failed", { user_id: user.id });
      const response = NextResponse.json(
        { error: error?.message ?? "Could not enqueue compose job." },
        { status: 400 },
      );
      return attachRequestId(response, trace.requestId);
    }

    const response = NextResponse.json({ job: data }, { status: 202 });
    endRequest(trace, 202, { user_id: user.id, job_id: data.id });
    return attachRequestId(response, trace.requestId);
  } catch (error) {
    failRequest(trace, 500, "compose_jobs_enqueue_unhandled_error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    const response = NextResponse.json({ error: "Internal server error." }, { status: 500 });
    return attachRequestId(response, trace.requestId);
  }
}
