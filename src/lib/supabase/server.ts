import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  env,
  hasSupabaseAnon,
  hasSupabaseServiceRole,
  hasSupabaseUrl,
} from "@/config/env";

export function createSupabaseServiceClient(): SupabaseClient | null {
  if (!hasSupabaseUrl || !hasSupabaseServiceRole || !env.NEXT_PUBLIC_SUPABASE_URL) {
    return null;
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function createSupabaseAnonClient(): SupabaseClient | null {
  if (!hasSupabaseUrl || !hasSupabaseAnon || !env.NEXT_PUBLIC_SUPABASE_URL) {
    return null;
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function createSupabaseUserClient(accessToken: string): SupabaseClient | null {
  if (!hasSupabaseUrl || !hasSupabaseAnon || !env.NEXT_PUBLIC_SUPABASE_URL) {
    return null;
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
