import { NextResponse } from "next/server";

import { env, hasOpenAI, hasSupabase } from "@/config/env";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "journa-studio",
    timestamp: new Date().toISOString(),
    providers: {
      openai: hasOpenAI,
      supabase: hasSupabase,
    },
    environment: env.NODE_ENV,
  });
}
