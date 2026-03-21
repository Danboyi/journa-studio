import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAccessToken } from "@/lib/auth/token";
import { createSupabaseUserClient } from "@/lib/supabase/server";
import { attachRequestId, beginRequest, endRequest, failRequest } from "@/lib/telemetry";

const addItemSchema = z.object({
  compositionId: z.uuid(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ collectionId: string }> },
) {
  const trace = beginRequest(request, "api.collections.items.add");

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
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      failRequest(trace, 401, "invalid_session");
      const response = NextResponse.json({ error: "Invalid session." }, { status: 401 });
      return attachRequestId(response, trace.requestId);
    }

    const params = await context.params;
    const parsed = addItemSchema.safeParse(await request.json());

    if (!parsed.success) {
      failRequest(trace, 400, "invalid_collection_item_body", { user_id: user.id });
      const response = NextResponse.json(
        { error: "Invalid request body.", issues: parsed.error.issues },
        { status: 400 },
      );
      return attachRequestId(response, trace.requestId);
    }

    const { data: collection, error: collectionError } = await supabase
      .from("collections")
      .select("id")
      .eq("id", params.collectionId)
      .eq("user_id", user.id)
      .single();

    if (collectionError || !collection) {
      failRequest(trace, 404, "collection_not_found", { user_id: user.id });
      const response = NextResponse.json({ error: "Collection not found." }, { status: 404 });
      return attachRequestId(response, trace.requestId);
    }

    const { data: composition, error: compositionError } = await supabase
      .from("compositions")
      .select("id")
      .eq("id", parsed.data.compositionId)
      .eq("user_id", user.id)
      .single();

    if (compositionError || !composition) {
      failRequest(trace, 404, "composition_not_found", { user_id: user.id });
      const response = NextResponse.json({ error: "Composition not found." }, { status: 404 });
      return attachRequestId(response, trace.requestId);
    }

    const { data: existingItems } = await supabase
      .from("collection_items")
      .select("position")
      .eq("collection_id", params.collectionId)
      .order("position", { ascending: false })
      .limit(1);

    const nextPosition = existingItems?.[0]?.position ? existingItems[0].position + 1 : 1;

    const { data, error } = await supabase
      .from("collection_items")
      .insert({
        collection_id: params.collectionId,
        composition_id: parsed.data.compositionId,
        position: nextPosition,
      })
      .select("id, collection_id, composition_id, position, created_at")
      .single();

    if (error || !data) {
      failRequest(trace, 400, "collection_item_insert_failed", { user_id: user.id });
      const message = error?.message?.includes("collection_id, composition_id")
        ? "Composition already exists in this collection."
        : error?.message ?? "Could not add composition.";
      const response = NextResponse.json({ error: message }, { status: 400 });
      return attachRequestId(response, trace.requestId);
    }

    const response = NextResponse.json({ item: data }, { status: 201 });
    endRequest(trace, 201, { user_id: user.id, item_id: data.id });
    return attachRequestId(response, trace.requestId);
  } catch (error) {
    failRequest(trace, 500, "collection_items_unhandled_error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    const response = NextResponse.json({ error: "Internal server error." }, { status: 500 });
    return attachRequestId(response, trace.requestId);
  }
}
