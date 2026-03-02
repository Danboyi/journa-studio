import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

type RequestContext = {
  requestId: string;
  route: string;
  startedAt: number;
};

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
  log("error", "request.fail", {
    request_id: context.requestId,
    route: context.route,
    status,
    message,
    duration_ms: Date.now() - context.startedAt,
    ...(extra ?? {}),
  });
}
