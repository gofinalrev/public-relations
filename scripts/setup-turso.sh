#!/usr/bin/env bash
# One-time: create Turso DB (free tier) and push local SQLite data.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DB_NAME="${TURSO_DB_NAME:-finalrev-pr}"
LOCAL_DB="${ROOT}/data/social-hq.db"

if ! command -v turso >/dev/null 2>&1; then
  echo "Install Turso CLI: curl -sSfL https://get.tur.so/install.sh | bash"
  exit 1
fi

if ! turso auth whoami >/dev/null 2>&1; then
  echo "Log in: turso auth login"
  turso auth login
fi

if ! turso db show "$DB_NAME" >/dev/null 2>&1; then
  echo "Creating Turso database: $DB_NAME"
  turso db create "$DB_NAME"
fi

DB_URL="$(turso db show "$DB_NAME" --url)"
DB_TOKEN="$(turso db tokens create "$DB_NAME")"

echo ""
echo "Add these to Vercel project env (and optionally .env.local for prod testing):"
echo "TURSO_DATABASE_URL=$DB_URL"
echo "TURSO_AUTH_TOKEN=$DB_TOKEN"
echo "APP_PUBLIC_URL=https://pr.finalrev.com"
echo ""

if [[ -f "$LOCAL_DB" ]]; then
  echo "Uploading local SQLite → Turso..."
  turso db shell "$DB_NAME" < /dev/null 2>/dev/null || true
  turso db import "$LOCAL_DB" --database "$DB_NAME" 2>/dev/null || {
    echo "If import fails, run: turso db shell $DB_NAME"
    echo "Then .read schema from app first deploy (auto-migrates on boot)."
  }
fi

echo "Done."
