import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

import { env } from "@/config/env";

type RequestContext = {
  requestId: string;
  route: string;
  startedAt: number;
};

const globalTelemetry = globalThis as typeof globalThis & {
  __journaAlertCache?: Map<string, number>;
};

const alertCache = globalTelemetry.__journaAlertCache ?? new Map<string, number>();
globalTelemetry.__journaAlertCache = alertCache;
const ALERT_COOLDOWN_MS = 2 * 60_000;

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 1,
  });
}

function log(level: "info" | "error", event: string, payload: Record<string, unknown>) {
  const entry = {
    level,
    event,
    ts: new Date().toISOString(),
    ...payload,
  };

  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export function beginRequest(request: NextRequest, route: string): RequestContext {
  const requestId = request.headers.get("x-request-id") || randomUUID();
  const context = { requestId, route, startedAt: Date.now() };

  log("info", "request.start", {
    request_id: context.requestId,
    route: context.route,
    method: request.method,
  });

  return context;
}

export function attachRequestId(response: NextResponse, requestId: string) {
  response.headers.set("x-request-id", requestId);
  return response;
}

export function endRequest(context: RequestContext, status: number, extra?: Record<string, unknown>) {
  log("info", "request.end", {
    request_id: context.requestId,
    route: context.route,
    status,
    duration_ms: Date.now() - context.startedAt,
    ...(extra ?? {}),
  });
}

export function failRequest(
  context: RequestContext,
  status: number,
  message: string,
  extra?: Record<string, unknown>,
) {
  const payload = {
    request_id: context.requestId,
    route: context.route,
    status,
    message,
    duration_ms: Date.now() - context.startedAt,
    ...(extra ?? {}),
  };

  log("error", "request.fail", payload);
  captureSentryFailure(context, payload);
  emitCriticalAlert(context, payload);
}

function captureSentryFailure(
  context: RequestContext,
  payload: Record<string, unknown> & { status: number; message: string },
) {
  if (!env.SENTRY_DSN || payload.status < 500) {
    return;
  }

  Sentry.captureException(new Error(payload.message), {
    tags: {
      route: context.route,
      status: String(payload.status),
      source: "journa-api",
    },
    extra: {
      request_id: context.requestId,
      ...payload,
    },
  });
}

function emitCriticalAlert(
  context: RequestContext,
  payload: Record<string, unknown> & { status: number; message: string },
) {
  if (payload.status < 500 || !env.ALERT_WEBHOOK_URL) {
    return;
  }

  const now = Date.now();
  const dedupeKey = `${context.route}:${payload.message}`;
  const nextAllowedAt = alertCache.get(dedupeKey) ?? 0;

  if (now < nextAllowedAt) {
    return;
  }

  alertCache.set(dedupeKey, now + ALERT_COOLDOWN_MS);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (env.ALERT_WEBHOOK_BEARER_TOKEN) {
    headers.Authorization = `Bearer ${env.ALERT_WEBHOOK_BEARER_TOKEN}`;
  }

  const alertBody = {
    source: "journa-api",
    service: env.OBSERVABILITY_SERVICE_NAME,
    environment: env.NODE_ENV,
    severity: "critical",
    event: "request.fail",
    ...payload,
    route: context.route,
    request_id: context.requestId,
  };

  void fetch(env.ALERT_WEBHOOK_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(alertBody),
    cache: "no-store",
  }).catch(() => {
    // Best effort only; request handlers must not fail on alert transport issues.
  });
}
