import { NextRequest, NextResponse } from "next/server";

import { composeDraft } from "@/lib/demo-composer";
import type { ComposeRequest } from "@/types/journa";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ComposeRequest;

  const output = composeDraft(body);

  return NextResponse.json(output);
}
