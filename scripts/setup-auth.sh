#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
SCOPE="${VERCEL_SCOPE:-finalrev}"
ENV="${ROOT}/.env.local"
FR="${ROOT}/../finalrev/frontend/.env.local"
read_env() { grep -E "^$1=" "$2" 2>/dev/null | tail -1 | cut -d= -f2- | tr -d '"' || true; }

URL="${NEXT_PUBLIC_SUPABASE_URL:-$(read_env NEXT_PUBLIC_SUPABASE_URL "$ENV")}"
URL="${URL:-$(read_env NEXT_PUBLIC_SUPABASE_URL "$FR")}"
URL="${URL:-https://zjkmxaqpybvbondulalx.supabase.co}"
KEY="${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:-$(read_env NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY "$ENV")}"
KEY="${KEY:-$(read_env NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY "$FR")}"
[[ -z "$KEY" ]] && { echo "Need NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"; exit 1; }

set_vercel() {
  npx vercel env rm "$1" production --scope "$SCOPE" --yes 2>/dev/null || true
  printf '%s' "$2" | npx vercel env add "$1" production --scope "$SCOPE" --force
}

for k in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY APP_PUBLIC_URL NETWORK_ONLY AUTH_ALLOWED_DOMAINS; do
  case $k in
    NEXT_PUBLIC_SUPABASE_URL) v="$URL" ;;
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) v="$KEY" ;;
    APP_PUBLIC_URL) v="https://pr.finalrev.com" ;;
    NETWORK_ONLY) v="false" ;;
    AUTH_ALLOWED_DOMAINS) v="finalrev.com" ;;
  esac
  echo "→ $k" && set_vercel "$k" "$v"
done

echo ""
echo "Supabase → Authentication → URL Configuration → Redirect URLs must include:"
echo "  https://pr.finalrev.com/auth/callback"
echo ""
echo "Or from finalrev repo: supabase login && supabase config push --project-ref zjkmxaqpybvbondulalx"
echo ""
echo "Google OAuth client ID/secret for PR hub go in Supabase (Google provider), not Vercel."
echo ""
npx vercel deploy --prod --yes --scope "$SCOPE"
