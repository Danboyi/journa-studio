import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  AUTH_COOKIE_NAME: z.string().min(1).default("journa_session"),
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  AUTH_COOKIE_NAME: process.env.AUTH_COOKIE_NAME,
});

export const hasOpenAI = Boolean(env.OPENAI_API_KEY);
export const hasSupabaseUrl = Boolean(env.NEXT_PUBLIC_SUPABASE_URL);
export const hasSupabaseAnon = Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const hasSupabaseServiceRole = Boolean(env.SUPABASE_SERVICE_ROLE_KEY);
export const hasSupabase = hasSupabaseUrl && (hasSupabaseAnon || hasSupabaseServiceRole);
