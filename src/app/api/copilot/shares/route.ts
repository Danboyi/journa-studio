import { NextRequest, NextResponse } from "next/server";

import { createShareSchema } from "@/lib/ai/schema";
import { getAccessToken } from "@/lib/auth/token";
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
    .select("id, token, expires_at, is_revoked, created_at, composition:compositions(id, title)")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ shares: data });
}

export async function POST(request: NextRequest) {
  const accessToken = getAccessToken(request);

  if (!accessToken) {
    return NextResponse.json({ error: "Missing session token." }, { status: 401 });
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

  const json = await request.json();
  const parsed = createShareSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { compositionId, expiresInDays } = parsed.data;

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
    })
    .select("id, token, expires_at, is_revoked, created_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Could not create share." }, { status: 400 });
  }

  return NextResponse.json({ share: data }, { status: 201 });
}
