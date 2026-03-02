import { NextRequest, NextResponse } from "next/server";

import { exportCompositionSchema } from "@/lib/ai/schema";
import { getAccessToken } from "@/lib/auth/token";
import { enforceRateLimit, getRequestIp, rateLimitResponse } from "@/lib/rate-limit";
import { createSupabaseUserClient } from "@/lib/supabase/server";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export async function POST(request: NextRequest) {
  const accessToken = getAccessToken(request);

  if (!accessToken) {
    return NextResponse.json({ error: "Missing session token." }, { status: 401 });
  }

  const ip = getRequestIp(request);
  const ipLimit = enforceRateLimit(`export:ip:${ip}`, { limit: 20, windowMs: 60_000 });

  if (!ipLimit.allowed) {
    return rateLimitResponse("Too many export requests. Try again shortly.", ipLimit.retryAfterSeconds);
  }

  const supabase = createSupabaseUserClient(accessToken);

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Invalid session." }, { status: 401 });
  }

  const userLimit = enforceRateLimit(`export:user:${user.id}`, {
    limit: 40,
    windowMs: 60_000,
  });

  if (!userLimit.allowed) {
    return rateLimitResponse("Export rate limit reached for your account.", userLimit.retryAfterSeconds);
  }

  const json = await request.json();
  const parsed = exportCompositionSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { compositionId, format } = parsed.data;

  const { data, error } = await supabase
    .from("compositions")
    .select("title, excerpt, draft, mode, mood, style_preset, created_at")
    .eq("id", compositionId)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Composition not found." }, { status: 404 });
  }

  const title = data.title;
  const header = [
    `Title: ${data.title}`,
    `Mode: ${data.mode}`,
    `Mood: ${data.mood}`,
    `Style: ${data.style_preset ?? "balanced"}`,
    `Created: ${data.created_at}`,
  ].join("\n");

  const content =
    format === "markdown"
      ? `# ${data.title}\n\n${data.excerpt}\n\n---\n\n${data.draft}`
      : `${header}\n\n${data.excerpt}\n\n${data.draft}`;

  const extension = format === "markdown" ? "md" : "txt";

  return NextResponse.json({
    filename: `${slugify(title) || "journa-piece"}.${extension}`,
    mimeType: format === "markdown" ? "text/markdown" : "text/plain",
    content,
  });
}
