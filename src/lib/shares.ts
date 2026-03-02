import { createSupabaseServiceClient } from "@/lib/supabase/server";

interface PublicShareRow {
  token: string;
  expires_at: string | null;
  is_revoked: boolean;
  composition: {
    id: string;
    title: string;
    excerpt: string;
    draft: string;
    mood: string;
    mode: string;
    style_preset: string | null;
    editorial_notes: string[];
    created_at: string;
  } | null;
}

export async function getPublicShareByToken(token: string) {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return { error: "Share service unavailable." as const };
  }

  const { data, error } = await supabase
    .from("composition_shares")
    .select(
      "token, expires_at, is_revoked, composition:compositions(id, title, excerpt, draft, mood, mode, style_preset, editorial_notes, created_at)",
    )
    .eq("token", token)
    .single<PublicShareRow>();

  if (error || !data || !data.composition) {
    return { error: "Share not found." as const };
  }

  if (data.is_revoked) {
    return { error: "Share link revoked." as const };
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { error: "Share link expired." as const };
  }

  return { data } as const;
}
