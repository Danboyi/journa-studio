import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth/cookie";

function hasAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    return true;
  }

  return Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
}

export function proxy(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return NextResponse.next();
  }

  if (!hasAuth(request)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/journal/:path*",
    "/api/copilot/history",
    "/api/copilot/shares/:path*",
    "/api/copilot/export",
    "/api/onboarding/profile",
    "/api/auth/session",
    "/api/auth/sign-out",
  ],
};
