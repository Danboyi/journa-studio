import { NextRequest, NextResponse } from "next/server";

import { getAccessToken } from "@/lib/auth/token";
import { createSupabaseUserClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const accessToken = getAccessToken(request);

  if (!accessToken) {
    return NextResponse.json({ error: "Missing session token." }, { status: 401 });
  }

  const supabase = createSupabaseUserClient(accessToken);

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const { data, error } = await supabase
    .from("compositions")
    .select("id, mode, mood, source_text, voice_notes, title, excerpt, draft, editorial_notes, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ compositions: data });
}
