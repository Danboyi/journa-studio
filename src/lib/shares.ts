import { verifySecret } from "@/lib/auth/password";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

interface PublicShareRow {
  id: string;
  token: string;
  expires_at: string | null;
  is_revoked: boolean;
  password_hash: string | null;
  view_count: number;
  last_viewed_at: string | null;
  composition: {
    id: string;
    title: string;
    excerpt: string;
    draft: string;
    mood: string;
    mode: string;
    style_preset: string | null;
    created_at: string;
  } | null;
}

type ShareError =
  | "Share service unavailable."
  | "Share not found."
  | "Share link revoked."
  | "Share link expired."
  | "Share password required."
  | "Invalid share password.";

export async function getPublicShareByToken(
  token: string,
  options?: {
    password?: string;
    incrementView?: boolean;
  },
) {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return { error: "Share service unavailable." as ShareError };
  }

  const { data, error } = await supabase
    .from("composition_shares")
    .select(
      "id, token, expires_at, is_revoked, password_hash, view_count, last_viewed_at, composition:compositions(id, title, excerpt, draft, mood, mode, style_preset, created_at)",
    )
    .eq("token", token)
    .single<PublicShareRow>();

  if (error || !data || !data.composition) {
    return { error: "Share not found." as ShareError };
  }

  if (data.is_revoked) {
    return { error: "Share link revoked." as ShareError };
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { error: "Share link expired." as ShareError };
  }

  if (data.password_hash) {
    if (!options?.password) {
      return { error: "Share password required." as ShareError };
    }

    if (!verifySecret(options.password, data.password_hash)) {
      return { error: "Invalid share password." as ShareError };
    }
  }

  if (options?.incrementView) {
    await supabase
      .from("composition_shares")
      .update({
        view_count: (data.view_count ?? 0) + 1,
        last_viewed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
  }

  return {
    data: {
      token: data.token,
      expires_at: data.expires_at,
      is_revoked: data.is_revoked,
      view_count: data.view_count ?? 0,
      last_viewed_at: data.last_viewed_at,
      composition: data.composition,
    },
  } as const;
}
