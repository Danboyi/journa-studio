import { NextRequest, NextResponse } from "next/server";

import { setSessionCookie } from "@/lib/auth/cookie";
import { enforceRateLimit, getRequestIp, rateLimitResponse } from "@/lib/rate-limit";
import { signUpSchema } from "@/lib/auth/schema";
import { createSupabaseAnonClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const ip = getRequestIp(request);
  const limit = enforceRateLimit(`auth:signup:${ip}`, { limit: 8, windowMs: 60_000 });

  if (!limit.allowed) {
    return rateLimitResponse("Too many sign-up attempts. Please wait and retry.", limit.retryAfterSeconds);
  }

  const supabase = createSupabaseAnonClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const json = await request.json();
  const parsed = signUpSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { email, password, fullName } = parsed.data;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const response = NextResponse.json({
    user: data.user,
    needsEmailConfirmation: !data.session,
  });

  if (data.session?.access_token) {
    setSessionCookie(response, data.session.access_token);
  }

  return response;
}
