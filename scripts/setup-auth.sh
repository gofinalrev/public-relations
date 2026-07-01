#!/usr/bin/env bash
# One-time: Google OAuth + finalrev service role for shop_admin checks. No Supabase redirect changes.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
SCOPE="${VERCEL_SCOPE:-finalrev}"
ENV="${ROOT}/.env.local"

read_env() { grep -E "^$1=" "$2" 2>/dev/null | tail -1 | cut -d= -f2- | tr -d '"'; }

CLIENT_ID="${GOOGLE_CLIENT_ID:-${1:-$(read_env GOOGLE_CLIENT_ID "$ENV")}}"
CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:-${2:-$(read_env GOOGLE_CLIENT_SECRET "$ENV")}}"
SUPABASE_SECRET="${SUPABASE_SECRET_KEY:-$(read_env SUPABASE_SECRET_KEY "$ENV")}"
SUPABASE_SECRET="${SUPABASE_SECRET:-$(read_env SUPABASE_SECRET_KEY "${ROOT}/../finalrev/frontend/.env.local")}"
SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://zjkmxaqpybvbondulalx.supabase.co}"

[[ -z "$CLIENT_ID" || -z "$CLIENT_SECRET" ]] && { echo "Need GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"; exit 1; }
[[ -z "$SUPABASE_SECRET" ]] && { echo "Need SUPABASE_SECRET_KEY (finalrev service_role)"; exit 1; }

AUTH_SECRET="$(read_env AUTH_SECRET "$ENV")"
AUTH_SECRET="${AUTH_SECRET:-$(openssl rand -base64 32)}"

set_vercel() {
  npx vercel env rm "$1" production --scope "$SCOPE" --yes 2>/dev/null || true
  printf '%s' "$2" | npx vercel env add "$1" production --scope "$SCOPE" --force
}

for k in AUTH_SECRET GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET NEXT_PUBLIC_SUPABASE_URL SUPABASE_SECRET_KEY APP_PUBLIC_URL AUTH_ALLOWED_DOMAINS NETWORK_ONLY; do
  case $k in
    AUTH_SECRET) v="$AUTH_SECRET" ;;
    GOOGLE_CLIENT_ID) v="$CLIENT_ID" ;;
    GOOGLE_CLIENT_SECRET) v="$CLIENT_SECRET" ;;
    NEXT_PUBLIC_SUPABASE_URL) v="$SUPABASE_URL" ;;
    SUPABASE_SECRET_KEY) v="$SUPABASE_SECRET" ;;
    APP_PUBLIC_URL) v="https://pr.finalrev.com" ;;
    AUTH_ALLOWED_DOMAINS) v="finalrev.com" ;;
    NETWORK_ONLY) v="false" ;;
  esac
  echo "→ $k"
  set_vercel "$k" "$v"
done

npx vercel deploy --prod --yes --scope finalrev
echo "Done. Shop admins: open https://pr.finalrev.com"
