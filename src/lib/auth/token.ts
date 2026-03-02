import { NextRequest } from "next/server";

export function getBearerToken(request: NextRequest): string | null {
  const value = request.headers.get("authorization");

  if (!value) {
    return null;
  }

  const [scheme, token] = value.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}
