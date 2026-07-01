# finalREV PR Dashboard

Internal dashboard for weekly social metrics, Tooltrace funnel data, and PR tooling (captions, copy, assets).

**Production:** [pr.finalrev.com](https://pr.finalrev.com) (finalrev Vercel team)  
**Access:** Google Sign-In — `@finalrev.com` only

## Quick start (local)

```bash
cp .env.example .env.local   # fill in keys (see below)
npm install
npm run dev                    # http://localhost:8787
```

## Environment variables

Copy `.env.example` → `.env.local`. Required for a full experience:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET` | Shop-admin-only access (`shop_admin` role in finalrev Supabase) |
| `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` | Shared weekly data |
| `POSTHOG_PERSONAL_API_KEY`, `POSTHOG_*` | Tooltrace + finalREV analytics |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Caption Studio |
| `RESEND_API_KEY` | Monday weekly email brief |

Optional: Stripe (Pro subs), Metricool API, YouTube API, Slack webhook, `CRON_SECRET`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on port 8787 (LAN-friendly) |
| `npm run build` | Production build |
| `npm run deploy` | Build + deploy to Vercel (finalrev team) |
| `npm run team:serve` | Build + serve on LAN (no Vercel) |
| `npm run cron:weekly` | Monday sync + email (host Mac crontab) |
| `npm run import-pdf` | Import a Metricool PDF from CLI |

## Project layout

```
src/
  app/           # Next.js routes, server actions, API
  components/    # Dashboard UI
  lib/           # DB, integrations (PostHog, Metricool, Gemini, auth)
scripts/         # Deploy, Turso setup, PDF import, weekly cron
public/          # Logos and brand assets
data/            # Local SQLite fallback (gitignored); production uses Turso
```

## Deployment

Linked to **finalrev/social-media** on Vercel. Deploy:

```bash
npm run deploy
```

Pull production env locally:

```bash
npx vercel env pull .env.vercel --scope finalrev
```

## Weekly ops

1. Julian imports Metricool PDF (Details tab) or runs `npm run import-pdf`
2. PostHog syncs on page load
3. Monday 9am PT: `scripts/local-weekly-sync.sh` (or `npm run cron:weekly`) sends the email brief
