import { NextRequest, NextResponse } from "next/server";

import { clearSessionCookie } from "@/lib/auth/cookie";
import { getAccessToken } from "@/lib/auth/token";
import { createSupabaseUserClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const accessToken = getAccessToken(request);

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);

  if (!accessToken) {
    return response;
  }

  const supabase = createSupabaseUserClient(accessToken);

  if (!supabase) {
    return response;
  }

  await supabase.auth.signOut();

  return response;
}
