#!/usr/bin/env bash
# Push .env.local values to Vercel production (one-time or after local changes).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
ENV_FILE="${1:-$ROOT/.env.local}"
SCOPE="${VERCEL_SCOPE:-finalrev}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

# Keys the PR hub needs in production. Empty values are skipped.
KEYS=(
  AUTH_SECRET
  GOOGLE_CLIENT_ID
  GOOGLE_CLIENT_SECRET
  NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_SECRET_KEY
  AUTH_ALLOWED_DOMAINS
  RESEND_API_KEY
  TURSO_DATABASE_URL
  TURSO_AUTH_TOKEN
  GOOGLE_GENERATIVE_AI_API_KEY
  GEMINI_MODEL
  POSTHOG_PERSONAL_API_KEY
  POSTHOG_PROJECT_ID
  POSTHOG_HOST
  POSTHOG_TOOLTRACE_HOSTNAMES
  POSTHOG_FINALREV_HOSTNAMES
  CRON_SECRET
)

read_env() {
  local key="$1"
  local line val
  line="$(grep -E "^${key}=" "$ENV_FILE" 2>/dev/null | tail -1 || true)"
  [[ -z "$line" ]] && return 1
  val="${line#*=}"
  val="${val%\"}"
  val="${val#\"}"
  val="${val%\'}"
  val="${val#\'}"
  [[ -z "${val// /}" ]] && return 1
  printf '%s' "$val"
}

set_vercel_env() {
  local key="$1"
  local value="$2"
  echo "  → $key"
  npx vercel env rm "$key" production --scope "$SCOPE" --yes 2>/dev/null || true
  printf '%s' "$value" | npx vercel env add "$key" production --scope "$SCOPE" --force
}

echo "Syncing env from $ENV_FILE to Vercel production ($SCOPE)…"
echo ""

SYNCED=0
for key in "${KEYS[@]}"; do
  if val="$(read_env "$key")"; then
    set_vercel_env "$key" "$val"
    SYNCED=$((SYNCED + 1))
  fi
done

# Production defaults (auth protects the app; no LAN-only block on Vercel)
set_vercel_env "NETWORK_ONLY" "false"
set_vercel_env "APP_PUBLIC_URL" "$(read_env APP_PUBLIC_URL || echo 'https://pr.finalrev.com')"
SYNCED=$((SYNCED + 2))

# AUTH_URL breaks Auth.js when empty or wrong — remove if present
npx vercel env rm AUTH_URL production --scope "$SCOPE" --yes 2>/dev/null || true

echo ""
echo "Synced $SYNCED variables. Redeploy: npm run deploy"
echo ""
echo "Sign-in: Google OAuth on pr.finalrev.com — redirect URI https://pr.finalrev.com/api/auth/callback/google"
