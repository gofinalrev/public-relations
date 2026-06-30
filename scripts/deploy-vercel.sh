#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Building finalREV PR Dashboard…"
npm run build

echo ""
echo "Deploying to finalrev/social-media (production)…"
npx vercel deploy --prod --yes --scope finalrev

echo ""
echo "Done. Set APP_PUBLIC_URL in Vercel to your production URL if not already."
