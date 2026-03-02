import { NextRequest, NextResponse } from "next/server";

import { setSessionCookie } from "@/lib/auth/cookie";
import { signUpSchema } from "@/lib/auth/schema";
import { createSupabaseAnonClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
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
