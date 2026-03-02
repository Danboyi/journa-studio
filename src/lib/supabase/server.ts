import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env, hasSupabase } from "@/config/env";

export function createSupabaseServerClient(): SupabaseClient | null {
  if (!hasSupabase || !env.NEXT_PUBLIC_SUPABASE_URL) {
    return null;
  }

  const key = env.SUPABASE_SERVICE_ROLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    return null;
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
