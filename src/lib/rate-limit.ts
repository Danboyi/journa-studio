import { NextRequest, NextResponse } from "next/server";

import { env, hasUpstashRedis } from "@/config/env";

type BucketEntry = {
  count: number;
  resetAt: number;
};

const globalBuckets = globalThis as typeof globalThis & {
  __journaRateLimitBuckets?: Map<string, BucketEntry>;
};

const localBuckets = globalBuckets.__journaRateLimitBuckets ?? new Map<string, BucketEntry>();
globalBuckets.__journaRateLimitBuckets = localBuckets;

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

function enforceLocalRateLimit(
  key: string,
  options: {
    limit: number;
    windowMs: number;
  },
) {
  const now = Date.now();
  const resetAt = currentWindow(now, options.windowMs);
  const entry = localBuckets.get(key);

  if (!entry || entry.resetAt <= now) {
    localBuckets.set(key, { count: 1, resetAt });
    return { allowed: true as const };
  }

  if (entry.count >= options.limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    return { allowed: false as const, retryAfterSeconds };
  }

  entry.count += 1;
  localBuckets.set(key, entry);
  return { allowed: true as const };
}

async function enforceRedisRateLimit(
  key: string,
  options: {
    limit: number;
    windowMs: number;
  },
) {
  if (!hasUpstashRedis || !env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  const now = Date.now();
  const windowId = Math.floor(now / options.windowMs);
  const redisKey = `journa:rl:${key}:${windowId}`;
  const ttlSeconds = Math.max(1, Math.ceil(options.windowMs / 1000));

  const response = await fetch(`${env.UPSTASH_REDIS_REST_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", redisKey],
      ["EXPIRE", redisKey, String(ttlSeconds)],
      ["TTL", redisKey],
    ]),
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as Array<{ result?: number }>;
  const count = payload?.[0]?.result;
  const ttl = payload?.[2]?.result;

  if (typeof count !== "number" || typeof ttl !== "number") {
    return null;
  }

  if (count > options.limit) {
    const retryAfterSeconds = Math.max(1, ttl);
    return { allowed: false as const, retryAfterSeconds };
  }

  return { allowed: true as const };
}

export async function enforceRateLimit(
  key: string,
  options: {
    limit: number;
    windowMs: number;
  },
) {
  try {
    const redisResult = await enforceRedisRateLimit(key, options);

    if (redisResult) {
      return redisResult;
    }
  } catch {
    // Fallback to local limiter when Redis is unavailable.
  }

  return enforceLocalRateLimit(key, options);
}

export function rateLimitResponse(message: string, retryAfterSeconds: number, requestId?: string) {
  const response = NextResponse.json({ error: message }, { status: 429 });
  response.headers.set("Retry-After", String(retryAfterSeconds));

  if (requestId) {
    response.headers.set("x-request-id", requestId);
  }

  return response;
}
