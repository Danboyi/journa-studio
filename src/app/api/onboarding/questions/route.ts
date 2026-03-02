import { NextResponse } from "next/server";

import { lifeCyclePromptPack } from "@/lib/prompt-packs";

export async function GET() {
  return NextResponse.json({
    questions: lifeCyclePromptPack,
  });
}
