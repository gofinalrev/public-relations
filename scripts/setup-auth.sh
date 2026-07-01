#!/usr/bin/env bash
# PR hub auth: Google sign-in on pr.finalrev.com + shop_admin check via finalrev Supabase (read-only).
# Does NOT change Supabase redirect URLs or auth settings.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
SCOPE="${VERCEL_SCOPE:-finalrev}"
ENV_FILE="${ROOT}/.env.local"
FINALREV_ENV="${ROOT}/../finalrev/frontend/.env.local"

echo "finalREV PR Hub — shop_admin auth setup"
echo "======================================="

read_env_val() {
  local file="$1" key="$2"
  grep -E "^${key}=" "$file" 2>/dev/null | tail -1 | cut -d= -f2- | tr -d '"' | tr -d "'"
}

touch "$ENV_FILE"

# Supabase URL + service role (read-only role check — copy from finalrev / Supabase API settings)
SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-$(read_env_val "$ENV_FILE" NEXT_PUBLIC_SUPABASE_URL)}"
SUPABASE_URL="${SUPABASE_URL:-https://zjkmxaqpybvbondulalx.supabase.co}"
SUPABASE_SECRET="${SUPABASE_SECRET_KEY:-$(read_env_val "$ENV_FILE" SUPABASE_SECRET_KEY)}"
SUPABASE_SECRET="${SUPABASE_SECRET:-$(read_env_val "$FINALREV_ENV" SUPABASE_SECRET_KEY)}"

CLIENT_ID="${GOOGLE_CLIENT_ID:-${1:-}}"
CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:-${2:-}}"

if [[ -z "${CLIENT_ID// /}" || -z "${CLIENT_SECRET// /}" ]]; then
  echo ""
  echo "Google OAuth (Web client) — add redirect URI in Google Cloud Console only:"
  echo "  https://pr.finalrev.com/api/auth/callback/google"
  echo "  http://localhost:8787/api/auth/callback/google"
  echo ""
  read -r -p "GOOGLE_CLIENT_ID: " CLIENT_ID
  read -r -s -p "GOOGLE_CLIENT_SECRET: " CLIENT_SECRET
  echo ""
fi

[[ -z "${CLIENT_ID// /}" || -z "${CLIENT_SECRET// /}" ]] && { echo "Missing Google OAuth credentials."; exit 1; }

if [[ -z "${SUPABASE_SECRET// /}" ]]; then
  echo ""
  echo "Paste finalrev production SUPABASE_SECRET_KEY (Supabase → Project Settings → API → service_role):"
  read -r -s SUPABASE_SECRET
  echo ""
fi

grep -vE '^(AUTH_SECRET|GOOGLE_CLIENT_ID|GOOGLE_CLIENT_SECRET|NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SECRET_KEY)=' "$ENV_FILE" > "${ENV_FILE}.tmp" 2>/dev/null || true
mv "${ENV_FILE}.tmp" "$ENV_FILE"

if ! grep -q '^AUTH_SECRET=' "$ENV_FILE" 2>/dev/null; then
  echo "AUTH_SECRET=$(openssl rand -base64 32)" >> "$ENV_FILE"
fi
{
  echo "NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL"
  echo "SUPABASE_SECRET_KEY=$SUPABASE_SECRET"
  echo "GOOGLE_CLIENT_ID=$CLIENT_ID"
  echo "GOOGLE_CLIENT_SECRET=$CLIENT_SECRET"
} >> "$ENV_FILE"

AUTH_SECRET="$(grep '^AUTH_SECRET=' "$ENV_FILE" | tail -1 | cut -d= -f2-)"

set_vercel() {
  echo "  → $1"
  npx vercel env rm "$1" production --scope "$SCOPE" --yes 2>/dev/null || true
  printf '%s' "$2" | npx vercel env add "$1" production --scope "$SCOPE" --force
}

echo ""
echo "Pushing to Vercel…"
set_vercel "AUTH_SECRET" "$AUTH_SECRET"
set_vercel "GOOGLE_CLIENT_ID" "$CLIENT_ID"
set_vercel "GOOGLE_CLIENT_SECRET" "$CLIENT_SECRET"
set_vercel "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL"
set_vercel "SUPABASE_SECRET_KEY" "$SUPABASE_SECRET"
set_vercel "APP_PUBLIC_URL" "https://pr.finalrev.com"
set_vercel "AUTH_ALLOWED_DOMAINS" "finalrev.com"
set_vercel "NETWORK_ONLY" "false"

for legacy in NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY AUTH_URL; do
  npx vercel env rm "$legacy" production --scope "$SCOPE" --yes 2>/dev/null || true
done

echo ""
echo "Redeploying…"
npx vercel deploy --prod --yes --scope finalrev

echo ""
echo "Done. Shop admins: https://pr.finalrev.com/sign-in — everyone else sees 404."
