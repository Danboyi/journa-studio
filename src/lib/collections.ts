import { createSupabaseServiceClient } from "@/lib/supabase/server";

interface PublicCollectionRow {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  is_public: boolean;
  created_at: string;
  items: Array<{
    id: string;
    position: number;
    composition: {
      id: string;
      title: string;
      excerpt: string;
      draft: string;
      mode: string;
      mood: string;
      style_preset: string | null;
      created_at: string;
    } | null;
  }> | null;
}

export async function getPublicCollectionBySlug(slug: string) {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return { error: "Collection service unavailable." as const };
  }

  const { data, error } = await supabase
    .from("collections")
    .select(
      "id, title, description, slug, is_public, created_at, items:collection_items(id, position, composition:compositions(id, title, excerpt, draft, mode, mood, style_preset, created_at))",
    )
    .eq("slug", slug)
    .eq("is_public", true)
    .single<PublicCollectionRow>();

  if (error || !data) {
    return { error: "Collection not found." as const };
  }

  const sortedItems = (data.items ?? [])
    .filter((item) => Boolean(item.composition))
    .sort((a, b) => a.position - b.position);

  return {
    data: {
      id: data.id,
      title: data.title,
      description: data.description,
      slug: data.slug,
      created_at: data.created_at,
      items: sortedItems,
    },
  } as const;
}
