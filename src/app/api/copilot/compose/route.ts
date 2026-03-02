import { NextRequest, NextResponse } from "next/server";

import { getComposeProvider } from "@/lib/ai/provider";
import { composeRequestSchema } from "@/lib/ai/schema";

export async function POST(request: NextRequest) {
  const json = await request.json();
  const parsed = composeRequestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const provider = getComposeProvider();
  const output = await provider.compose(parsed.data);

  return NextResponse.json(output);
}
