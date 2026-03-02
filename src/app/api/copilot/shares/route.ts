import { NextRequest, NextResponse } from "next/server";

import { createShareSchema } from "@/lib/ai/schema";
import { hashSecret } from "@/lib/auth/password";
import { getAccessToken } from "@/lib/auth/token";
import { enforceRateLimit, getRequestIp, rateLimitResponse } from "@/lib/rate-limit";
import { createSupabaseUserClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const accessToken = getAccessToken(request);

  if (!accessToken) {
    return NextResponse.json({ error: "Missing session token." }, { status: 401 });
  }

  const supabase = createSupabaseUserClient(accessToken);

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("composition_shares")
    .select("id, token, composition_id, expires_at, is_revoked, password_hash, view_count, last_viewed_at, created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
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
}

export async function POST(request: NextRequest) {
  const accessToken = getAccessToken(request);

  if (!accessToken) {
    return NextResponse.json({ error: "Missing session token." }, { status: 401 });
  }

  const ip = getRequestIp(request);
  const ipLimit = enforceRateLimit(`shares:create:ip:${ip}`, { limit: 20, windowMs: 60_000 });

  if (!ipLimit.allowed) {
    return rateLimitResponse("Too many share requests. Try again shortly.", ipLimit.retryAfterSeconds);
  }

  const supabase = createSupabaseUserClient(accessToken);

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Invalid session." }, { status: 401 });
  }

  const userLimit = enforceRateLimit(`shares:create:user:${user.id}`, {
    limit: 40,
    windowMs: 60_000,
  });

  if (!userLimit.allowed) {
    return rateLimitResponse("Share rate limit reached for your account.", userLimit.retryAfterSeconds);
  }

  const json = await request.json();
  const parsed = createShareSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { compositionId, expiresInDays, password } = parsed.data;

  const { data: composition, error: compositionError } = await supabase
    .from("compositions")
    .select("id")
    .eq("id", compositionId)
    .eq("user_id", user.id)
    .single();

  if (compositionError || !composition) {
    return NextResponse.json({ error: "Composition not found." }, { status: 404 });
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
    return NextResponse.json({ error: error?.message ?? "Could not create share." }, { status: 400 });
  }

  return NextResponse.json(
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
}
