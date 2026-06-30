#!/usr/bin/env bash
# Monday 8am PT — run on the host Mac (crontab), not on public Vercel.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

PORT="${PORT:-8787}"
SECRET="${CRON_SECRET:-}"
URL="http://127.0.0.1:${PORT}/api/cron/weekly-sync"

if [[ -z "$SECRET" ]]; then
  echo "CRON_SECRET not set in .env.local — cron routes are unprotected on LAN only."
  curl -fsS "$URL"
else
  curl -fsS -H "Authorization: Bearer $SECRET" "$URL"
fi

echo ""
