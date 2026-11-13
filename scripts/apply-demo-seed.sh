#!/usr/bin/env bash
# Loads (or removes) the Peachtree Dressage Association sales-demo dataset on
# the Supabase project that .env.local points at, via the Management API.
#
#   scripts/apply-demo-seed.sh            apply supabase/seed/demo-business-seed.sql
#   scripts/apply-demo-seed.sh --cleanup  apply supabase/seed/demo-business-cleanup.sql
#   scripts/apply-demo-seed.sh --verify   run the read-only counts in demo-business-verify.sql
#
#   scripts/apply-demo-seed.sh --calendar          apply supabase/seed/demo-shows-calendar.sql
#   scripts/apply-demo-seed.sh --calendar-cleanup  apply supabase/seed/demo-shows-calendar-cleanup.sql
#   scripts/apply-demo-seed.sh --calendar-verify   per-show state of the calendar shows (read-only)
#
# The calendar part (six shows dated from TODAY: live, last-chance, on sale,
# on sale soon) needs the main seed first. Re-run --calendar any day to move
# its dates to that day. Regenerate it with:
# node scripts/generate-demo-calendar-seed.mjs
#
# Writes (everything but the --verify modes) only run when the project ref is
# listed in FA_SCRIPT_ALLOWED_PROJECT_REFS (shell or .env.local) and
# --i-know-this-is-not-prod is passed, e.g.
#   scripts/apply-demo-seed.sh --calendar --i-know-this-is-not-prod
# Never allowlist production: the seed creates paid orders and riders.
#
# Seed and cleanup each run as ONE transaction (the files carry their own
# begin/commit), so a failure leaves the database untouched. Both are
# re-runnable. Regenerate the SQL with: node scripts/generate-demo-seed.mjs
set -euo pipefail

cd "$(dirname "$0")/.."

TOKEN=$(grep '^SUPABASE_ACCESS_TOKEN=' .env.local | head -1 | cut -d= -f2- | tr -d '"')
REF=$(grep '^NEXT_PUBLIC_SUPABASE_URL=' .env.local | head -1 | sed -E 's#.*https://([a-z0-9]+)\..*#\1#')

if [[ -z "$TOKEN" || -z "$REF" ]]; then
  echo "SUPABASE_ACCESS_TOKEN or NEXT_PUBLIC_SUPABASE_URL missing in .env.local" >&2
  exit 1
fi

NOT_PROD=false
ARGS=()
for arg in "$@"; do
  if [[ "$arg" == "--i-know-this-is-not-prod" ]]; then NOT_PROD=true; else ARGS+=("$arg"); fi
done

MODE="seed"
case "${ARGS[0]:-}" in
  "") ;;
  --cleanup) MODE="cleanup" ;;
  --verify) MODE="verify" ;;
  --calendar) MODE="calendar" ;;
  --calendar-cleanup) MODE="calendar-cleanup" ;;
  --calendar-verify) MODE="calendar-verify" ;;
  *) echo "Usage: $0 [--cleanup|--verify|--calendar|--calendar-cleanup|--calendar-verify]" >&2; exit 1 ;;
esac

case "$MODE" in
  seed) FILE="supabase/seed/demo-business-seed.sql"; ACTION="LOAD the demo dataset (300 riders, 325 horses, 300 paid orders, 30 vendors) into" ;;
  cleanup) FILE="supabase/seed/demo-business-cleanup.sql"; ACTION="REMOVE the demo dataset from" ;;
  verify) FILE="supabase/seed/demo-business-verify.sql"; ACTION="" ;;
  calendar) FILE="supabase/seed/demo-shows-calendar.sql"; ACTION="LOAD / REFRESH the six date-relative demo shows (dates move to today) in" ;;
  calendar-cleanup) FILE="supabase/seed/demo-shows-calendar-cleanup.sql"; ACTION="REMOVE the six calendar demo shows (and everything on them) from" ;;
  calendar-verify) FILE="supabase/seed/demo-shows-calendar-verify.sql"; ACTION="" ;;
esac
IS_VERIFY=false
[[ "$MODE" == "verify" || "$MODE" == "calendar-verify" ]] && IS_VERIFY=true

GEN="scripts/generate-demo-seed.mjs"
[[ "$MODE" == calendar* ]] && GEN="scripts/generate-demo-calendar-seed.mjs"
[[ -f "$FILE" ]] || { echo "$FILE not found — run: node $GEN" >&2; exit 1; }

if [[ "$IS_VERIFY" != true ]]; then
  ALLOWED="${FA_SCRIPT_ALLOWED_PROJECT_REFS:-$(grep '^FA_SCRIPT_ALLOWED_PROJECT_REFS=' .env.local | head -1 | cut -d= -f2- | tr -d '"' || true)}"
  if [[ "$NOT_PROD" != true || ",${ALLOWED// /}," != *",$REF,"* ]]; then
    echo "Refusing to write to project $REF." >&2
    echo "Add it to FA_SCRIPT_ALLOWED_PROJECT_REFS and pass --i-know-this-is-not-prod." >&2
    echo "Never allowlist production." >&2
    exit 1
  fi
fi

echo "Project: $REF"
echo "File:    $FILE"
if [[ "$IS_VERIFY" != true ]]; then
  read -r -p "$ACTION this project? [y/N] " answer
  [[ "$answer" == "y" || "$answer" == "Y" ]] || { echo "Cancelled."; exit 0; }
fi

# The seed is ~500 KB — too big for a single curl argument, so the JSON body
# goes through a temp file.
BODY=$(mktemp)
trap 'rm -f "$BODY"' EXIT
python3 -c 'import json,sys; print(json.dumps({"query": open(sys.argv[1]).read()}))' "$FILE" > "$BODY"

response=$(curl -sS -w '\n%{http_code}' -X POST \
  "https://api.supabase.com/v1/projects/$REF/database/query" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  --data @"$BODY")
status="${response##*$'\n'}"
payload="${response%$'\n'*}"

if [[ "$status" != 2* ]]; then
  echo "✗ failed (HTTP $status):"
  echo "$payload"
  echo
  [[ "$IS_VERIFY" == true ]] || echo "Nothing was changed — the file runs in one transaction."
  exit 1
fi

if [[ "$IS_VERIFY" == true ]]; then
  python3 -c '
import json, sys
for row in json.loads(sys.argv[1]):
    print("  %-42s %s" % (row["metric"], row["value"]))
' "$payload"
else
  echo "✓ done (HTTP $status)"
  if [[ "$MODE" == calendar* ]]; then
    echo "Check it with: $0 --calendar-verify"
  else
    echo "Check it with: $0 --verify"
  fi
fi
