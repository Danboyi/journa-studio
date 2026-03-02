import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/config/env";

export const SESSION_COOKIE_NAME = env.AUTH_COOKIE_NAME;

export function readSessionToken(request: NextRequest): string | null {
  return request.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export function setSessionCookie(response: NextResponse, accessToken: string) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: accessToken,
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
