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
SECRET="${SUPABASE_SECRET_KEY:-$(read_env SUPABASE_SECRET_KEY "$ENV")}"
SECRET="${SECRET:-$(read_env SUPABASE_SERVICE_ROLE_KEY "$FR")}"
AUTH_SECRET="${AUTH_SECRET:-$(read_env AUTH_SECRET "$ENV")}"
GOOGLE_ID="${GOOGLE_CLIENT_ID:-$(read_env GOOGLE_CLIENT_ID "$ENV")}"
GOOGLE_ID="${GOOGLE_ID:-$(read_env GOOGLE_CLIENT_ID "$FR")}"
GOOGLE_SECRET="${GOOGLE_CLIENT_SECRET:-$(read_env GOOGLE_CLIENT_SECRET "$ENV")}"
GOOGLE_SECRET="${GOOGLE_SECRET:-$(read_env GOOGLE_CLIENT_SECRET "$FR")}"

[[ -z "$SECRET" ]] && { echo "Need SUPABASE_SECRET_KEY (shop_admin lookup)"; exit 1; }
[[ -z "$AUTH_SECRET" ]] && { echo "Need AUTH_SECRET (openssl rand -base64 32)"; exit 1; }
[[ -z "$GOOGLE_ID" || -z "$GOOGLE_SECRET" ]] && { echo "Need GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on Vercel"; exit 1; }

set_vercel() {
  npx vercel env rm "$1" production --scope "$SCOPE" --yes 2>/dev/null || true
  printf '%s' "$2" | npx vercel env add "$1" production --scope "$SCOPE" --force
}

for k in NEXT_PUBLIC_SUPABASE_URL SUPABASE_SECRET_KEY AUTH_SECRET GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET APP_PUBLIC_URL NETWORK_ONLY AUTH_ALLOWED_DOMAINS; do
  case $k in
    NEXT_PUBLIC_SUPABASE_URL) v="$URL" ;;
    SUPABASE_SECRET_KEY) v="$SECRET" ;;
    AUTH_SECRET) v="$AUTH_SECRET" ;;
    GOOGLE_CLIENT_ID) v="$GOOGLE_ID" ;;
    GOOGLE_CLIENT_SECRET) v="$GOOGLE_SECRET" ;;
    APP_PUBLIC_URL) v="https://pr.finalrev.com" ;;
    NETWORK_ONLY) v="false" ;;
    AUTH_ALLOWED_DOMAINS) v="finalrev.com" ;;
  esac
  echo "→ $k" && set_vercel "$k" "$v"
done

echo ""
echo "Google Cloud Console → OAuth client → Authorized redirect URI:"
echo "  https://pr.finalrev.com/api/auth/callback/google"
echo ""
echo "Sign-in uses Google OAuth directly on pr.finalrev.com (not Supabase redirect URLs)."
echo ""
npx vercel deploy --prod --yes --scope "$SCOPE"
