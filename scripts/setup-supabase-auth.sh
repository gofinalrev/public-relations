#!/usr/bin/env bash
# Push finalrev Supabase auth env to .env.local + Vercel (same Google sign-in as finalrev.com).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
SCOPE="${VERCEL_SCOPE:-finalrev}"
ENV_FILE="${ROOT}/.env.local"

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://zjkmxaqpybvbondulalx.supabase.co}"
SUPABASE_KEY="${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:-sb_publishable_lRGc3pvCxVGSmGGpskA-6g_elc2hK8g}"

echo "finalREV PR Hub — Supabase Google sign-in"
echo "========================================"

touch "$ENV_FILE"
grep -v '^NEXT_PUBLIC_SUPABASE_URL=' "$ENV_FILE" 2>/dev/null | grep -v '^NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=' > "${ENV_FILE}.tmp" || true
mv "${ENV_FILE}.tmp" "$ENV_FILE"
{
  echo "NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL"
  echo "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$SUPABASE_KEY"
} >> "$ENV_FILE"

set_vercel() {
  echo "  → $1"
  npx vercel env rm "$1" production --scope "$SCOPE" --yes 2>/dev/null || true
  printf '%s' "$2" | npx vercel env add "$1" production --scope "$SCOPE" --force
}

echo ""
echo "Pushing to Vercel production…"
set_vercel "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL"
set_vercel "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" "$SUPABASE_KEY"
set_vercel "APP_PUBLIC_URL" "https://pr.finalrev.com"
set_vercel "AUTH_ALLOWED_DOMAINS" "finalrev.com"
set_vercel "NETWORK_ONLY" "false"

# Remove legacy NextAuth env vars if present
for legacy in AUTH_SECRET GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET AUTH_URL; do
  npx vercel env rm "$legacy" production --scope "$SCOPE" --yes 2>/dev/null || true
done

echo ""
echo "Team entry (bookmark, do not link publicly): https://pr.finalrev.com/sign-in"
echo ""
echo "Supabase → Auth → URL Configuration → Redirect URLs must include:"
echo "  https://pr.finalrev.com/auth/callback"
echo "  http://localhost:8787/auth/callback"
echo ""
echo "In finalrev repo: supabase config push (remotes.main.additional_redirect_urls)"
echo ""
echo "Redeploying…"
npx vercel deploy --prod --yes --scope finalrev

echo ""
echo "Done. Shop admins: https://pr.finalrev.com/sign-in — everyone else sees 404."
