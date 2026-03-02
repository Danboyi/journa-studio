# My Journa (journa-studio)

Mobile-first web foundation for a premium journaling app with AI writing copilot.

## What is included

- Next.js 16 + TypeScript + Tailwind CSS v4
- Premium UI shell (Journal Mode + Copilot Mode)
- Reusable UI primitives (`Button`, `Card`, `Badge`, `Textarea`)
- API routes:
  - `GET /api/health`
  - `POST /api/journal/daily-questions`
  - `GET/POST /api/journal/entries`
  - `GET/POST /api/collections`
  - `POST /api/collections/:collectionId/items`
  - `POST /api/copilot/compose`
  - `GET /api/copilot/history`
  - `POST /api/copilot/export`
  - `GET/POST /api/copilot/shares`
  - `DELETE /api/copilot/shares/:shareId`
  - `GET /api/public/share/:token`
  - `GET /api/public/collections/:slug`
  - `GET /api/onboarding/questions`
  - `POST /api/onboarding/profile`
  - `POST /api/auth/sign-up`
  - `POST /api/auth/sign-in`
  - `POST /api/auth/sign-out`
  - `GET /api/auth/session`
- Cookie-based auth session (HTTP-only, secure in production)
- Provider-based AI orchestration:
  - OpenAI structured output provider when `OPENAI_API_KEY` exists
  - Deterministic demo provider fallback
- Env validation with `zod`
- Supabase schema + RLS migration
- CI workflow (`lint` + `build`) and Vercel deploy workflow
- Playwright e2e workflow for critical authenticated flows

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env.local` and set values.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
SENTRY_DSN=
OPENAI_MODEL=gpt-4.1-mini
NEXT_PUBLIC_APP_URL=http://localhost:3000
AUTH_COOKIE_NAME=journa_session
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
ALERT_WEBHOOK_URL=
ALERT_WEBHOOK_BEARER_TOKEN=
OBSERVABILITY_SERVICE_NAME=journa-studio
```

## Observability

- Every traced API response includes `x-request-id`
- Structured request logs are emitted for start/end/fail events
- `5xx` failures are captured to Sentry when `SENTRY_DSN` is set
- Critical failures (`5xx`) can trigger webhook alerts when `ALERT_WEBHOOK_URL` is configured

## Supabase setup

Run SQL migration in your Supabase project:

- `supabase/migrations/20260302180000_initial_schema.sql`
- `supabase/migrations/20260302193000_add_onboarding_profile.sql`
- `supabase/migrations/20260302201500_add_style_preset_to_compositions.sql`
- `supabase/migrations/20260302214500_add_composition_shares.sql`
- `supabase/migrations/20260302223000_add_share_security_analytics.sql`
- `supabase/migrations/20260302233000_add_published_collections.sql`
- `supabase/migrations/20260302235500_add_usage_events_guardrails.sql`

This creates:

- `profiles`
- `journal_entries`
- `compositions`
- ownership-based RLS policies for all three

## Deployment

See `docs/deployment/vercel.md` for required GitHub secrets and Vercel configuration.

## E2E testing

Run critical flow tests (auth, compose, share, collection publish):

```bash
npm run test:e2e
```

Required env vars for this suite:

- `E2E_USER_EMAIL`
- `E2E_USER_PASSWORD`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`








