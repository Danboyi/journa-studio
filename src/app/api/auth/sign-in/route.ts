import { NextRequest, NextResponse } from "next/server";

import { clearSessionCookie, setSessionCookie } from "@/lib/auth/cookie";
import { enforceRateLimit, getRequestIp, rateLimitResponse } from "@/lib/rate-limit";
import { signInSchema } from "@/lib/auth/schema";
import { createSupabaseAnonClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const ip = getRequestIp(request);
  const limit = enforceRateLimit(`auth:signin:${ip}`, { limit: 12, windowMs: 60_000 });

  if (!limit.allowed) {
    return rateLimitResponse("Too many sign-in attempts. Please wait and retry.", limit.retryAfterSeconds);
  }

  const supabase = createSupabaseAnonClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const json = await request.json();
  const parsed = signInSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user || !data.session?.access_token) {
    const fail = NextResponse.json(
      { error: error?.message ?? "Invalid credentials." },
      { status: 401 },
    );
    clearSessionCookie(fail);
    return fail;
  }

  const response = NextResponse.json({
    user: data.user,
  });

  setSessionCookie(response, data.session.access_token);

  return response;
}
