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
  - `POST /api/copilot/compose`
  - `POST /api/auth/sign-up`
  - `POST /api/auth/sign-in`
  - `POST /api/auth/sign-out`
  - `GET /api/auth/session`
- Provider-based AI orchestration:
  - OpenAI structured output provider when `OPENAI_API_KEY` exists
  - Deterministic demo provider fallback
- Env validation with `zod`
- Supabase schema + RLS migration
- CI workflow (`lint` + `build`) and Vercel deploy workflow

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
OPENAI_MODEL=gpt-4.1-mini
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Supabase setup

Run SQL migration in your Supabase project:

- `supabase/migrations/20260302180000_initial_schema.sql`

This creates:

- `profiles`
- `journal_entries`
- `compositions`
- ownership-based RLS policies for all three

## Deployment

See `docs/deployment/vercel.md` for required GitHub secrets and Vercel configuration.
