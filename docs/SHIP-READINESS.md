# Journa Ship Readiness

## Current status

Journa has completed a major product-shaping pass and now includes:
- private journal capture
- AI reflection vs rewrite separation
- persisted reflection payloads
- memory retrieval
- related memories
- recurrence summaries
- weekly/monthly recap rituals
- privacy/trust surface
- mobile ergonomics pass
- semantic reranking for retrieval
- public share / collection reading polish

## What has been validated locally

- `npm run lint`
- `npm run build`
- route compilation across app + API surfaces

## What still needs verification before broad public launch

### 1. Supabase migrations must be applied
Apply all migrations in order, including newer additions such as:
- `20260311061500_add_reflection_payload_to_compositions.sql`

### 2. Environment must be complete
Required/important env vars now include:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_EMBEDDING_MODEL`
- `NEXT_PUBLIC_APP_URL`
- `AUTH_COOKIE_NAME`
- `JOB_RUNNER_TOKEN`
- `COMPOSE_JOB_BATCH_SIZE`

### 3. Critical authenticated E2E flow should be run with real credentials
Playwright suite exists at:
- `e2e/critical-flows.spec.ts`

Required env vars:
- `E2E_USER_EMAIL`
- `E2E_USER_PASSWORD`
- `E2E_BASE_URL` (optional if local)

### 4. Async job processing must be configured in production
`POST /api/internal/compose-jobs/process` requires the job runner token.
A scheduler/worker must hit that route consistently.

### 5. Manual QA still recommended
Especially verify:
- sign up / sign in / sign out
- journal save and reload
- reflection output
- related memories opening
- recap ritual actions
- share link creation / revoke
- public share read
- public collection read
- mobile layout sanity

## Recommended next operational steps

1. Push local commits to GitHub intentionally
2. Apply Supabase migrations in staging/production
3. Fill env vars, especially embedding model and job runner token
4. Run Playwright critical flow test with real credentials
5. Do a manual product walkthrough on desktop + mobile
6. Ship behind staged rollout / trusted users first

## Honest note

Journa is much stronger and more coherent now, but “ready for millions” still depends on operational correctness, migration hygiene, real-user QA, and deployment discipline — not just feature count.
