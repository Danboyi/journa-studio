import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAccessToken } from "@/lib/auth/token";
import { createSupabaseUserClient } from "@/lib/supabase/server";
import { attachRequestId, beginRequest, endRequest, failRequest } from "@/lib/telemetry";

const createCollectionSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(1000).optional().default(""),
  isPublic: z.boolean().optional().default(false),
});

function slugify(value: string) {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);

  return base || "collection";
}

export async function GET(request: NextRequest) {
  const trace = beginRequest(request, "api.collections.list");

  try {
    const accessToken = getAccessToken(request);

    if (!accessToken) {
      failRequest(trace, 401, "missing_session");
      const response = NextResponse.json({ error: "Missing session token." }, { status: 401 });
      return attachRequestId(response, trace.requestId);
    }

    const supabase = createSupabaseUserClient(accessToken);

    if (!supabase) {
      failRequest(trace, 503, "supabase_unconfigured");
      const response = NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
      return attachRequestId(response, trace.requestId);
    }

    const { data, error } = await supabase
      .from("collections")
      .select(
        "id, title, description, slug, is_public, created_at, updated_at, items:collection_items(id, composition_id, position, composition:compositions(id, title, excerpt, mode, mood, style_preset))",
      )
      .order("created_at", { ascending: false });

    if (error) {
      failRequest(trace, 400, "collections_query_failed");
      const response = NextResponse.json({ error: error.message }, { status: 400 });
      return attachRequestId(response, trace.requestId);
    }

    const response = NextResponse.json({ collections: data });
    endRequest(trace, 200, { collections_count: data?.length ?? 0 });
    return attachRequestId(response, trace.requestId);
  } catch (error) {
    failRequest(trace, 500, "collections_get_unhandled_error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    const response = NextResponse.json({ error: "Internal server error." }, { status: 500 });
    return attachRequestId(response, trace.requestId);
  }
}

export async function POST(request: NextRequest) {
  const trace = beginRequest(request, "api.collections.create");

  try {
    const accessToken = getAccessToken(request);

    if (!accessToken) {
      failRequest(trace, 401, "missing_session");
      const response = NextResponse.json({ error: "Missing session token." }, { status: 401 });
      return attachRequestId(response, trace.requestId);
    }

    const supabase = createSupabaseUserClient(accessToken);

    if (!supabase) {
      failRequest(trace, 503, "supabase_unconfigured");
      const response = NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
      return attachRequestId(response, trace.requestId);
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      failRequest(trace, 401, "invalid_session");
      const response = NextResponse.json({ error: "Invalid session." }, { status: 401 });
      return attachRequestId(response, trace.requestId);
    }

    const parsed = createCollectionSchema.safeParse(await request.json());

    if (!parsed.success) {
      failRequest(trace, 400, "invalid_collection_body", { user_id: user.id });
      const response = NextResponse.json(
        { error: "Invalid request body.", issues: parsed.error.issues },
        { status: 400 },
      );
      return attachRequestId(response, trace.requestId);
    }

    const slugSeed = `${slugify(parsed.data.title)}-${Date.now().toString().slice(-6)}`;

    const { data, error } = await supabase
      .from("collections")
      .insert({
        user_id: user.id,
        title: parsed.data.title,
        description: parsed.data.description || null,
        is_public: parsed.data.isPublic,
        slug: slugSeed,
      })
      .select("id, title, description, slug, is_public, created_at, updated_at")
      .single();

    if (error || !data) {
      failRequest(trace, 400, "collection_insert_failed", { user_id: user.id });
      const response = NextResponse.json(
        { error: error?.message ?? "Could not create collection." },
        { status: 400 },
      );
      return attachRequestId(response, trace.requestId);
    }

    const response = NextResponse.json({ collection: data }, { status: 201 });
    endRequest(trace, 201, { user_id: user.id, collection_id: data.id });
    return attachRequestId(response, trace.requestId);
  } catch (error) {
    failRequest(trace, 500, "collections_post_unhandled_error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    const response = NextResponse.json({ error: "Internal server error." }, { status: 500 });
    return attachRequestId(response, trace.requestId);
  }
}
