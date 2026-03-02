import { NextRequest, NextResponse } from "next/server";

import { getComposeProvider } from "@/lib/ai/provider";
import {
  calculateRetryDelayMs,
  composeJobPayloadSchema,
  payloadToComposeInput,
} from "@/lib/compose-jobs";
import { env } from "@/config/env";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { attachRequestId, beginRequest, endRequest, failRequest } from "@/lib/telemetry";
import { reserveDailyUsage } from "@/lib/usage-guardrails";

type ClaimedJob = {
  id: string;
  user_id: string;
  payload: unknown;
  attempt_count: number;
  max_attempts: number;
};

function isRunnerAuthorized(request: NextRequest) {
  if (!env.JOB_RUNNER_TOKEN) {
    return false;
  }

  const provided =
    request.headers.get("x-job-runner-token") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  return provided === env.JOB_RUNNER_TOKEN;
}

export async function POST(request: NextRequest) {
  const trace = beginRequest(request, "api.internal.compose-jobs.process");

  try {
    if (!isRunnerAuthorized(request)) {
      failRequest(trace, 401, "unauthorized_job_runner");
      const response = NextResponse.json({ error: "Unauthorized." }, { status: 401 });
      return attachRequestId(response, trace.requestId);
    }

    const supabase = createSupabaseServiceClient();

    if (!supabase) {
      failRequest(trace, 503, "supabase_unconfigured");
      const response = NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
      return attachRequestId(response, trace.requestId);
    }

    const batchSizeParam = Number(request.nextUrl.searchParams.get("batchSize") ?? "");
    const batchSize =
      Number.isFinite(batchSizeParam) && batchSizeParam > 0
        ? Math.min(Math.trunc(batchSizeParam), 25)
        : env.COMPOSE_JOB_BATCH_SIZE;

    await supabase
      .from("compose_jobs")
      .update({
        status: "queued",
        next_run_at: new Date().toISOString(),
        last_error: "Recovered from stale processing lock.",
      })
      .eq("status", "processing")
      .lt("started_at", new Date(Date.now() - 15 * 60_000).toISOString());

    const { data, error } = await supabase.rpc("claim_compose_jobs", { p_limit: batchSize });

    if (error) {
      failRequest(trace, 400, "compose_jobs_claim_failed", { detail: error.message });
      const response = NextResponse.json({ error: error.message }, { status: 400 });
      return attachRequestId(response, trace.requestId);
    }

    const jobs = (data ?? []) as ClaimedJob[];
    const provider = getComposeProvider();

    let completed = 0;
    let requeued = 0;
    let failed = 0;

    for (const job of jobs) {
      try {
        const parsed = composeJobPayloadSchema.safeParse(job.payload);

        if (!parsed.success) {
          throw new Error("Invalid job payload.");
        }

        const composeInput = payloadToComposeInput(parsed.data);
        const units = composeInput.sourceText.length + composeInput.voiceNotes.length;
        const budgetCheck = await reserveDailyUsage(supabase, {
          userId: job.user_id,
          endpoint: "compose-async",
          units,
          dailyLimit: 120_000,
        });

        if (!budgetCheck.allowed) {
          await supabase
            .from("compose_jobs")
            .update({
              status: "failed",
              completed_at: new Date().toISOString(),
              last_error: budgetCheck.reason,
            })
            .eq("id", job.id);
          failed += 1;
          continue;
        }

        const output = await provider.compose(composeInput);

        const { data: composition, error: compositionError } = await supabase
          .from("compositions")
          .insert({
            user_id: job.user_id,
            mode: composeInput.mode,
            mood: composeInput.mood,
            style_preset: composeInput.stylePreset ?? "balanced",
            source_text: composeInput.sourceText,
            voice_notes: composeInput.voiceNotes,
            title: output.title,
            excerpt: output.excerpt,
            draft: output.draft,
            editorial_notes: output.editorialNotes,
          })
          .select("id")
          .single();

        if (compositionError || !composition) {
          throw new Error(compositionError?.message ?? "Failed to persist composition.");
        }

        await supabase
          .from("compose_jobs")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            composition_id: composition.id,
            last_error: null,
          })
          .eq("id", job.id);

        completed += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown job error.";
        const shouldRetry = job.attempt_count < job.max_attempts;

        if (shouldRetry) {
          const retryAt = new Date(Date.now() + calculateRetryDelayMs(job.attempt_count)).toISOString();
          await supabase
            .from("compose_jobs")
            .update({
              status: "queued",
              next_run_at: retryAt,
              last_error: message,
            })
            .eq("id", job.id);
          requeued += 1;
        } else {
          await supabase
            .from("compose_jobs")
            .update({
              status: "failed",
              completed_at: new Date().toISOString(),
              last_error: message,
            })
            .eq("id", job.id);
          failed += 1;
        }
      }
    }

    const response = NextResponse.json({
      claimed: jobs.length,
      completed,
      requeued,
      failed,
    });
    endRequest(trace, 200, { claimed: jobs.length, completed, requeued, failed });
    return attachRequestId(response, trace.requestId);
  } catch (error) {
    failRequest(trace, 500, "compose_jobs_process_unhandled_error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    const response = NextResponse.json({ error: "Internal server error." }, { status: 500 });
    return attachRequestId(response, trace.requestId);
  }
}
