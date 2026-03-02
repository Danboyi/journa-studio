import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAccessToken } from "@/lib/auth/token";
import { createSupabaseUserClient } from "@/lib/supabase/server";

const addItemSchema = z.object({
  compositionId: z.uuid(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ collectionId: string }> },
) {
  const accessToken = getAccessToken(request);

  if (!accessToken) {
    return NextResponse.json({ error: "Missing session token." }, { status: 401 });
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

  const params = await context.params;
  const parsed = addItemSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { data: collection, error: collectionError } = await supabase
    .from("collections")
    .select("id")
    .eq("id", params.collectionId)
    .eq("user_id", user.id)
    .single();

  if (collectionError || !collection) {
    return NextResponse.json({ error: "Collection not found." }, { status: 404 });
  }

  const { data: composition, error: compositionError } = await supabase
    .from("compositions")
    .select("id")
    .eq("id", parsed.data.compositionId)
    .eq("user_id", user.id)
    .single();

  if (compositionError || !composition) {
    return NextResponse.json({ error: "Composition not found." }, { status: 404 });
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
    const message = error?.message?.includes("collection_id, composition_id")
      ? "Composition already exists in this collection."
      : error?.message ?? "Could not add composition.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ item: data }, { status: 201 });
}
