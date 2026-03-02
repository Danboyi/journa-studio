# My Journa (journa-studio)

Mobile-first web foundation for a premium journaling app with AI writing copilot.

## What is included

- Next.js 16 + TypeScript + Tailwind CSS v4
- Premium UI shell (Journal Mode + Copilot Mode)
- Reusable UI primitives (`Button`, `Card`, `Badge`, `Textarea`)
- API routes:
  - `GET /api/health`
  - `POST /api/journal/daily-questions`
  - `POST /api/copilot/compose`
- Provider-based AI orchestration:
  - OpenAI provider when `OPENAI_API_KEY` exists
  - Deterministic demo provider fallback
- Env validation with `zod`
- Supabase server client scaffolding

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
```

## Notes

- If no OpenAI key is configured, compose requests use local fallback generation.
- Supabase setup is scaffolded for the next phase (auth + persistent journal storage).
