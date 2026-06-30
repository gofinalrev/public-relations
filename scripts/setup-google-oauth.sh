#!/usr/bin/env bash
# One-time: push Google OAuth credentials to .env.local + Vercel, then redeploy.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
SCOPE="${VERCEL_SCOPE:-finalrev}"
ENV_FILE="${ROOT}/.env.local"

REDIRECTS=(
  "https://pr.finalrev.com/api/auth/callback/google"
  "http://localhost:8787/api/auth/callback/google"
)

echo "finalREV PR Hub — Google OAuth setup"
echo "====================================="
echo ""

CLIENT_ID="${GOOGLE_CLIENT_ID:-${1:-}}"
CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:-${2:-}}"

if [[ -z "${CLIENT_ID// /}" || -z "${CLIENT_SECRET// /}" ]]; then
  echo "Create a Web OAuth client in Google Cloud Console:"
  echo "  https://console.cloud.google.com/apis/credentials/oauthclient"
  echo ""
  echo "  Name: finalREV PR Hub"
  echo "  Redirect URIs:"
  for uri in "${REDIRECTS[@]}"; do echo "    $uri"; done
  echo "  Consent screen: Internal (@finalrev.com Workspace)"
  echo ""
  read -r -p "GOOGLE_CLIENT_ID: " CLIENT_ID
  read -r -s -p "GOOGLE_CLIENT_SECRET: " CLIENT_SECRET
  echo ""
fi

[[ -z "${CLIENT_ID// /}" || -z "${CLIENT_SECRET// /}" ]] && { echo "Missing client ID or secret."; exit 1; }

touch "$ENV_FILE"
grep -v '^GOOGLE_CLIENT_ID=' "$ENV_FILE" 2>/dev/null | grep -v '^GOOGLE_CLIENT_SECRET=' > "${ENV_FILE}.tmp" || true
mv "${ENV_FILE}.tmp" "$ENV_FILE"

if ! grep -q '^AUTH_SECRET=' "$ENV_FILE"; then
  echo "AUTH_SECRET=$(openssl rand -base64 32)" >> "$ENV_FILE"
fi
{
  echo "GOOGLE_CLIENT_ID=$CLIENT_ID"
  echo "GOOGLE_CLIENT_SECRET=$CLIENT_SECRET"
} >> "$ENV_FILE"

set_vercel() {
  echo "  → $1"
  npx vercel env rm "$1" production --scope "$SCOPE" --yes 2>/dev/null || true
  printf '%s' "$2" | npx vercel env add "$1" production --scope "$SCOPE" --force
}

AUTH_SECRET="$(grep '^AUTH_SECRET=' "$ENV_FILE" | tail -1 | cut -d= -f2-)"

echo ""
echo "Pushing to Vercel production…"
set_vercel "AUTH_SECRET" "$AUTH_SECRET"
set_vercel "GOOGLE_CLIENT_ID" "$CLIENT_ID"
set_vercel "GOOGLE_CLIENT_SECRET" "$CLIENT_SECRET"
set_vercel "AUTH_ALLOWED_DOMAINS" "finalrev.com"
set_vercel "APP_PUBLIC_URL" "https://pr.finalrev.com"
set_vercel "NETWORK_ONLY" "false"
npx vercel env rm AUTH_URL production --scope "$SCOPE" --yes 2>/dev/null || true

echo ""
echo "Redeploying…"
npx vercel deploy --prod --yes --scope finalrev

echo ""
echo "Done. Sign in at https://pr.finalrev.com (Google account picker, @finalrev.com only)."
