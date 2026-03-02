import { NextRequest, NextResponse } from "next/server";

import { exportCompositionSchema } from "@/lib/ai/schema";
import { getAccessToken } from "@/lib/auth/token";
import { enforceRateLimit, getRequestIp, rateLimitResponse } from "@/lib/rate-limit";
import { createSupabaseUserClient } from "@/lib/supabase/server";
import { attachRequestId, beginRequest, endRequest, failRequest } from "@/lib/telemetry";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export async function POST(request: NextRequest) {
  const trace = beginRequest(request, "api.copilot.export");

  try {
    const accessToken = getAccessToken(request);

    if (!accessToken) {
      failRequest(trace, 401, "missing_session");
      const response = NextResponse.json({ error: "Missing session token." }, { status: 401 });
      return attachRequestId(response, trace.requestId);
    }

    const ip = getRequestIp(request);
    const ipLimit = await enforceRateLimit(`export:ip:${ip}`, { limit: 20, windowMs: 60_000 });

    if (!ipLimit.allowed) {
      failRequest(trace, 429, "export_ip_limited");
      return rateLimitResponse(
        "Too many export requests. Try again shortly.",
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
    } = await supabase.auth.getUser();

    if (userError || !user) {
      failRequest(trace, 401, "invalid_session");
      const response = NextResponse.json({ error: "Invalid session." }, { status: 401 });
      return attachRequestId(response, trace.requestId);
    }

    const userLimit = await enforceRateLimit(`export:user:${user.id}`, {
      limit: 40,
      windowMs: 60_000,
    });

    if (!userLimit.allowed) {
      failRequest(trace, 429, "export_user_limited", { user_id: user.id });
      return rateLimitResponse(
        "Export rate limit reached for your account.",
        userLimit.retryAfterSeconds,
        trace.requestId,
      );
    }

    const json = await request.json();
    const parsed = exportCompositionSchema.safeParse(json);

    if (!parsed.success) {
      failRequest(trace, 400, "invalid_export_body");
      const response = NextResponse.json(
        { error: "Invalid request body.", issues: parsed.error.issues },
        { status: 400 },
      );
      return attachRequestId(response, trace.requestId);
    }

    const { compositionId, format } = parsed.data;

    const { data, error } = await supabase
      .from("compositions")
      .select("title, excerpt, draft, mode, mood, style_preset, created_at")
      .eq("id", compositionId)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      failRequest(trace, 404, "composition_not_found", { composition_id: compositionId });
      const response = NextResponse.json({ error: "Composition not found." }, { status: 404 });
      return attachRequestId(response, trace.requestId);
    }

    const title = data.title;
    const header = [
      `Title: ${data.title}`,
      `Mode: ${data.mode}`,
      `Mood: ${data.mood}`,
      `Style: ${data.style_preset ?? "balanced"}`,
      `Created: ${data.created_at}`,
    ].join("\n");

    const content =
      format === "markdown"
        ? `# ${data.title}\n\n${data.excerpt}\n\n---\n\n${data.draft}`
        : `${header}\n\n${data.excerpt}\n\n${data.draft}`;

    const extension = format === "markdown" ? "md" : "txt";

    const response = NextResponse.json({
      filename: `${slugify(title) || "journa-piece"}.${extension}`,
      mimeType: format === "markdown" ? "text/markdown" : "text/plain",
      content,
    });

    endRequest(trace, 200, { user_id: user.id, format });
    return attachRequestId(response, trace.requestId);
  } catch (error) {
    failRequest(trace, 500, "export_unhandled_error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    const response = NextResponse.json({ error: "Internal server error." }, { status: 500 });
    return attachRequestId(response, trace.requestId);
  }
}
