import { NextRequest, NextResponse } from "next/server";

type BucketEntry = {
  count: number;
  resetAt: number;
};

const globalBuckets = globalThis as typeof globalThis & {
  __journaRateLimitBuckets?: Map<string, BucketEntry>;
};

const buckets = globalBuckets.__journaRateLimitBuckets ?? new Map<string, BucketEntry>();
globalBuckets.__journaRateLimitBuckets = buckets;

function currentWindow(now: number, windowMs: number) {
  return now - (now % windowMs) + windowMs;
}

export function getRequestIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  const realIp = request.headers.get("x-real-ip");
  return realIp?.trim() || "unknown";
}

export function enforceRateLimit(
  key: string,
  options: {
    limit: number;
    windowMs: number;
  },
) {
  const now = Date.now();
  const resetAt = currentWindow(now, options.windowMs);
  const entry = buckets.get(key);

  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true as const };
  }

  if (entry.count >= options.limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    return { allowed: false as const, retryAfterSeconds };
  }

  entry.count += 1;
  buckets.set(key, entry);
  return { allowed: true as const };
}

export function rateLimitResponse(message: string, retryAfterSeconds: number) {
  const response = NextResponse.json({ error: message }, { status: 429 });
  response.headers.set("Retry-After", String(retryAfterSeconds));
  return response;
}
