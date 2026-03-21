import { NextRequest, NextResponse } from "next/server";

import { createShareSchema } from "@/lib/ai/schema";
import { hashSecret } from "@/lib/auth/password";
import { getAccessToken } from "@/lib/auth/token";
import { enforceRateLimit, getRequestIp, rateLimitResponse } from "@/lib/rate-limit";
import { createSupabaseUserClient } from "@/lib/supabase/server";
import { attachRequestId, beginRequest, endRequest, failRequest } from "@/lib/telemetry";

export async function GET(request: NextRequest) {
  const trace = beginRequest(request, "api.copilot.shares.get");

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
      .from("composition_shares")
      .select("id, token, composition_id, expires_at, is_revoked, password_hash, view_count, last_viewed_at, created_at")
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      failRequest(trace, 400, "shares_query_failed");
      const response = NextResponse.json({ error: error.message }, { status: 400 });
      return attachRequestId(response, trace.requestId);
    }

    const response = NextResponse.json({
      shares: (data ?? []).map((item) => ({
        id: item.id,
        token: item.token,
        composition_id: item.composition_id,
        expires_at: item.expires_at,
        is_revoked: item.is_revoked,
        password_protected: Boolean(item.password_hash),
        view_count: item.view_count ?? 0,
        last_viewed_at: item.last_viewed_at,
        created_at: item.created_at,
      })),
    });

    endRequest(trace, 200);
    return attachRequestId(response, trace.requestId);
  } catch (error) {
    failRequest(trace, 500, "shares_get_unhandled_error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    const response = NextResponse.json({ error: "Internal server error." }, { status: 500 });
    return attachRequestId(response, trace.requestId);
  }
}

export async function POST(request: NextRequest) {
  const trace = beginRequest(request, "api.copilot.shares.create");

  try {
    const accessToken = getAccessToken(request);

    if (!accessToken) {
      failRequest(trace, 401, "missing_session");
      const response = NextResponse.json({ error: "Missing session token." }, { status: 401 });
      return attachRequestId(response, trace.requestId);
    }

    const ip = getRequestIp(request);
    const ipLimit = await enforceRateLimit(`shares:create:ip:${ip}`, { limit: 20, windowMs: 60_000 });

    if (!ipLimit.allowed) {
      failRequest(trace, 429, "shares_create_ip_limited");
      return rateLimitResponse(
        "Too many share requests. Try again shortly.",
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

    const userLimit = await enforceRateLimit(`shares:create:user:${user.id}`, {
      limit: 40,
      windowMs: 60_000,
    });

    if (!userLimit.allowed) {
      failRequest(trace, 429, "shares_create_user_limited", { user_id: user.id });
      return rateLimitResponse(
        "Share rate limit reached for your account.",
        userLimit.retryAfterSeconds,
        trace.requestId,
      );
    }

    const json = await request.json();
    const parsed = createShareSchema.safeParse(json);

    if (!parsed.success) {
      failRequest(trace, 400, "invalid_share_body");
      const response = NextResponse.json(
        { error: "Invalid request body.", issues: parsed.error.issues },
        { status: 400 },
      );
      return attachRequestId(response, trace.requestId);
    }

    const { compositionId, expiresInDays, password } = parsed.data;

    const { data: composition, error: compositionError } = await supabase
      .from("compositions")
      .select("id")
      .eq("id", compositionId)
      .eq("user_id", user.id)
      .single();

    if (compositionError || !composition) {
      failRequest(trace, 404, "composition_not_found", { composition_id: compositionId });
      const response = NextResponse.json({ error: "Composition not found." }, { status: 404 });
      return attachRequestId(response, trace.requestId);
    }

    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("composition_shares")
      .insert({
        user_id: user.id,
        composition_id: compositionId,
        expires_at: expiresAt,
        password_hash: password ? hashSecret(password) : null,
      })
      .select("id, token, composition_id, expires_at, is_revoked, password_hash, view_count, last_viewed_at, created_at")
      .single();

    if (error || !data) {
      failRequest(trace, 400, "share_insert_failed");
      const response = NextResponse.json(
        { error: error?.message ?? "Could not create share." },
        { status: 400 },
      );
      return attachRequestId(response, trace.requestId);
    }

    const response = NextResponse.json(
      {
        share: {
          id: data.id,
          token: data.token,
          composition_id: data.composition_id,
          expires_at: data.expires_at,
          is_revoked: data.is_revoked,
          password_protected: Boolean(data.password_hash),
          view_count: data.view_count ?? 0,
          last_viewed_at: data.last_viewed_at,
          created_at: data.created_at,
        },
      },
      { status: 201 },
    );

    endRequest(trace, 201, { user_id: user.id });
    return attachRequestId(response, trace.requestId);
  } catch (error) {
    failRequest(trace, 500, "shares_create_unhandled_error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    const response = NextResponse.json({ error: "Internal server error." }, { status: 500 });
    return attachRequestId(response, trace.requestId);
  }
}
