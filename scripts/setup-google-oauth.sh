#!/usr/bin/env bash
# One-time: create Google OAuth Web client + push to .env.local and Vercel.
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

if [[ -n "${1:-}" && -n "${2:-}" ]]; then
  CLIENT_ID="$1"
  CLIENT_SECRET="$2"
  echo "Using provided client ID + secret."
else
  echo "Open Google Cloud Console and create a Web OAuth client:"
  echo ""
  echo "  1. https://console.cloud.google.com/apis/credentials"
  echo "  2. Create Credentials → OAuth client ID → Web application"
  echo "  3. Name: finalREV PR Hub"
  echo "  4. Authorized redirect URIs:"
  for uri in "${REDIRECTS[@]}"; do echo "       $uri"; done
  echo "  5. If prompted, OAuth consent screen → Internal (finalrev.com Workspace)"
  echo ""
  read -r -p "Paste GOOGLE_CLIENT_ID: " CLIENT_ID
  read -r -s -p "Paste GOOGLE_CLIENT_SECRET: " CLIENT_SECRET
  echo ""
fi

[[ -z "${CLIENT_ID// /}" || -z "${CLIENT_SECRET// /}" ]] && { echo "Missing client ID or secret."; exit 1; }

# Update .env.local
touch "$ENV_FILE"
grep -v '^GOOGLE_CLIENT_ID=' "$ENV_FILE" 2>/dev/null | grep -v '^GOOGLE_CLIENT_SECRET=' > "${ENV_FILE}.tmp" || true
mv "${ENV_FILE}.tmp" "$ENV_FILE"
{
  grep -q '^AUTH_SECRET=' "$ENV_FILE" || echo "AUTH_SECRET=$(openssl rand -base64 32)"
  echo "GOOGLE_CLIENT_ID=$CLIENT_ID"
  echo "GOOGLE_CLIENT_SECRET=$CLIENT_SECRET"
} >> "$ENV_FILE"

echo ""
echo "Pushing to Vercel production ($SCOPE)…"
set_vercel() {
  npx vercel env rm "$1" production --scope "$SCOPE" --yes 2>/dev/null || true
  printf '%s' "$2" | npx vercel env add "$1" production --scope "$SCOPE" --force
}

AUTH_SECRET="$(grep '^AUTH_SECRET=' "$ENV_FILE" | tail -1 | cut -d= -f2-)"
set_vercel "AUTH_SECRET" "$AUTH_SECRET"
set_vercel "GOOGLE_CLIENT_ID" "$CLIENT_ID"
set_vercel "GOOGLE_CLIENT_SECRET" "$CLIENT_SECRET"
set_vercel "AUTH_ALLOWED_DOMAINS" "finalrev.com"
set_vercel "APP_PUBLIC_URL" "https://pr.finalrev.com"
set_vercel "NETWORK_ONLY" "false"
npx vercel env rm AUTH_URL production --scope "$SCOPE" --yes 2>/dev/null || true

echo ""
echo "Done. Redeploy: npm run deploy"
echo "Sign-in: https://pr.finalrev.com → Google account picker (@finalrev.com)"
