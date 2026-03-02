import { NextRequest, NextResponse } from "next/server";

import { getPublicShareByToken } from "@/lib/shares";

function mapStatus(error: string) {
  if (error === "Share password required." || error === "Invalid share password.") {
    return 401;
  }

  if (error === "Share service unavailable.") {
    return 503;
  }

  return 404;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  const params = await context.params;
  const password = request.nextUrl.searchParams.get("password") ?? undefined;
  const result = await getPublicShareByToken(params.token, {
    password,
    incrementView: true,
  });

  if ("error" in result) {
    const message = result.error ?? "Share not found.";
    return NextResponse.json({ error: message }, { status: mapStatus(message) });
  }

  return NextResponse.json({ share: result.data });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  const params = await context.params;
  const body = (await request.json()) as { password?: string };

  const result = await getPublicShareByToken(params.token, {
    password: body.password,
    incrementView: true,
  });

  if ("error" in result) {
    const message = result.error ?? "Share not found.";
    return NextResponse.json({ error: message }, { status: mapStatus(message) });
  }

  return NextResponse.json({ share: result.data });
}
