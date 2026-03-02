import { NextRequest } from "next/server";

import { readSessionToken } from "@/lib/auth/cookie";

export function getAccessToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization");

  if (header) {
    const [scheme, token] = header.split(" ");

    if (scheme?.toLowerCase() === "bearer" && token) {
      return token;
    }
  }

  return readSessionToken(request);
}
