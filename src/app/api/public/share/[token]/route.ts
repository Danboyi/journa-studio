import { NextRequest, NextResponse } from "next/server";

import { getPublicShareByToken } from "@/lib/shares";
import { attachRequestId, beginRequest, endRequest, failRequest } from "@/lib/telemetry";

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
  const trace = beginRequest(request, "api.public.share.get");

  try {
    const params = await context.params;
    const password = request.nextUrl.searchParams.get("password") ?? undefined;
    const result = await getPublicShareByToken(params.token, {
      password,
      incrementView: true,
    });

    if ("error" in result) {
      const message = result.error ?? "Share not found.";
      const status = mapStatus(message);
      failRequest(trace, status, "public_share_get_failed", { detail: message });
      const response = NextResponse.json({ error: message }, { status });
      return attachRequestId(response, trace.requestId);
    }

    const response = NextResponse.json({ share: result.data });
    endRequest(trace, 200, { share_token: result.data.token });
    return attachRequestId(response, trace.requestId);
  } catch (error) {
    failRequest(trace, 500, "public_share_get_unhandled_error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    const response = NextResponse.json({ error: "Internal server error." }, { status: 500 });
    return attachRequestId(response, trace.requestId);
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  const trace = beginRequest(request, "api.public.share.unlock");

  try {
    const params = await context.params;
    const body = (await request.json()) as { password?: string };

    const result = await getPublicShareByToken(params.token, {
      password: body.password,
      incrementView: true,
    });

    if ("error" in result) {
      const message = result.error ?? "Share not found.";
      const status = mapStatus(message);
      failRequest(trace, status, "public_share_unlock_failed", { detail: message });
      const response = NextResponse.json({ error: message }, { status });
      return attachRequestId(response, trace.requestId);
    }

    const response = NextResponse.json({ share: result.data });
    endRequest(trace, 200, { share_token: result.data.token });
    return attachRequestId(response, trace.requestId);
  } catch (error) {
    failRequest(trace, 500, "public_share_unlock_unhandled_error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    const response = NextResponse.json({ error: "Internal server error." }, { status: 500 });
    return attachRequestId(response, trace.requestId);
  }
}
