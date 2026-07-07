#!/usr/bin/env bash
# Adds PR hub redirect URLs to the production Supabase project (zjkmxaqpybvbondulalx).
# Requires: supabase login  OR  SUPABASE_ACCESS_TOKEN in env.
set -euo pipefail
REF="${SUPABASE_PROJECT_REF:-zjkmxaqpybvbondulalx}"
FINALREV_ROOT="$(cd "$(dirname "$0")/../../finalrev" 2>/dev/null && pwd || true)"

echo "Production Supabase must allow OAuth return to:"
echo "  https://pr.finalrev.com"
echo ""
echo "Option A — Dashboard (anyone with Supabase access):"
echo "  Authentication → URL Configuration → Redirect URLs → Add URL"
echo "  https://pr.finalrev.com"
echo ""
echo "Option B — CLI from finalrev repo (applies supabase/config.toml):"
if [[ -n "$FINALREV_ROOT" && -f "$FINALREV_ROOT/supabase/config.toml" ]]; then
  echo "  cd $FINALREV_ROOT"
  echo "  supabase login"
  echo "  supabase config push --project-ref $REF --yes"
else
  echo "  cd ../finalrev && supabase login && supabase config push --project-ref $REF --yes"
fi
echo ""
if [[ -n "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "SUPABASE_ACCESS_TOKEN set — attempting config push..."
  if [[ -n "$FINALREV_ROOT" && -f "$FINALREV_ROOT/supabase/config.toml" ]]; then
    (cd "$FINALREV_ROOT" && supabase config push --project-ref "$REF" --yes)
  else
    echo "finalrev repo not found at ../finalrev — use dashboard instead."
    exit 1
  fi
else
  echo "No SUPABASE_ACCESS_TOKEN — add the redirect URL in the dashboard or run Option B."
fi
