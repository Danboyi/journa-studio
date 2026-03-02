# Vercel Deployment

This repo includes CI for lint/build and can deploy automatically to Vercel from GitHub Actions.

## Required GitHub Secrets

Set these secrets in `Settings -> Secrets and variables -> Actions`:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Connect Vercel Project

Run once locally:

```bash
vercel link
```

Then copy values from `.vercel/project.json` into GitHub secrets.

## Environments

Configure these variables in Vercel for both Preview and Production:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `NEXT_PUBLIC_APP_URL`

## Workflow Behavior

- Pull requests: deploy Preview
- Push to `main`: deploy Production
