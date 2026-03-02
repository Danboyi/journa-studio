import { NextResponse } from "next/server";

import { dailyPromptPack } from "@/lib/prompt-packs";

export async function POST() {
  return NextResponse.json({
    prompts: dailyPromptPack,
    cadence: "daily",
    generatedAt: new Date().toISOString(),
  });
}
