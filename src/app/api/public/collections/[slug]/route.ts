import { NextResponse } from "next/server";

import { getPublicCollectionBySlug } from "@/lib/collections";

export async function GET(
  _: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const params = await context.params;
  const result = await getPublicCollectionBySlug(params.slug);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ collection: result.data });
}
