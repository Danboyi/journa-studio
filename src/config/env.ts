import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  OPENAI_API_KEY: z.string().min(1).optional(),
  SENTRY_DSN: z.string().url().optional(),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  AUTH_COOKIE_NAME: z.string().min(1).default("journa_session"),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  ALERT_WEBHOOK_URL: z.string().url().optional(),
  ALERT_WEBHOOK_BEARER_TOKEN: z.string().min(1).optional(),
  OBSERVABILITY_SERVICE_NAME: z.string().min(1).default("journa-studio"),
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  SENTRY_DSN: process.env.SENTRY_DSN,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  AUTH_COOKIE_NAME: process.env.AUTH_COOKIE_NAME,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  ALERT_WEBHOOK_URL: process.env.ALERT_WEBHOOK_URL,
  ALERT_WEBHOOK_BEARER_TOKEN: process.env.ALERT_WEBHOOK_BEARER_TOKEN,
  OBSERVABILITY_SERVICE_NAME: process.env.OBSERVABILITY_SERVICE_NAME,
});

export const hasOpenAI = Boolean(env.OPENAI_API_KEY);
export const hasSupabaseUrl = Boolean(env.NEXT_PUBLIC_SUPABASE_URL);
export const hasSupabaseAnon = Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const hasSupabaseServiceRole = Boolean(env.SUPABASE_SERVICE_ROLE_KEY);
export const hasSupabase = hasSupabaseUrl && (hasSupabaseAnon || hasSupabaseServiceRole);
export const hasUpstashRedis = Boolean(
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN,
);
