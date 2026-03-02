import { NextResponse } from "next/server";

import { getPublicShareByToken } from "@/lib/shares";

export async function GET(
  _: Request,
  context: { params: Promise<{ token: string }> },
) {
  const params = await context.params;
  const result = await getPublicShareByToken(params.token);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ share: result.data });
}