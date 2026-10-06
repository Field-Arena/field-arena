#!/usr/bin/env bash
# Applies the 2026-10-02 audit migrations to the Supabase project that
# .env.local points at, in order, one transaction per file. Stops at the first
# error. Each file is re-runnable, and each success is recorded in
# supabase_migrations.schema_migrations so `supabase db push` won't re-run it.
set -euo pipefail

cd "$(dirname "$0")/.."

TOKEN=$(grep '^SUPABASE_ACCESS_TOKEN=' .env.local | head -1 | cut -d= -f2- | tr -d '"')
REF=$(grep '^NEXT_PUBLIC_SUPABASE_URL=' .env.local | head -1 | sed -E 's#.*https://([a-z0-9]+)\..*#\1#')

if [[ -z "$TOKEN" || -z "$REF" ]]; then
  echo "SUPABASE_ACCESS_TOKEN or NEXT_PUBLIC_SUPABASE_URL missing in .env.local" >&2
  exit 1
fi

FILES=(
  20260930120000_staff_judge_license.sql
  20261002120000_audit_security_fixes.sql
  20261002130000_payments_followups.sql
  20261002131000_shows_followups.sql
  20261002132000_scoring_followups.sql
  20261002133000_admin_followups.sql
  20261005121000_stable_toggle_precondition.sql
  20261006120000_catalog_usdf_score_type.sql
  20261006121000_catalog_add_rgd_freestyle.sql
)

echo "Project: $REF"
read -r -p "Apply ${#FILES[@]} migrations to this project? [y/N] " answer
[[ "$answer" == "y" || "$answer" == "Y" ]] || { echo "Cancelled."; exit 0; }

for file in "${FILES[@]}"; do
  path="supabase/migrations/$file"
  version="${file%%_*}"
  name="${file#*_}"
  name="${name%.sql}"

  # The licence column was added by hand earlier; only record it.
  if [[ "$file" == 20260930120000_* ]]; then
    sql="insert into supabase_migrations.schema_migrations (version, name)
         values ('$version', '$name') on conflict (version) do nothing;"
  else
    sql="begin;
$(cat "$path")
insert into supabase_migrations.schema_migrations (version, name)
values ('$version', '$name') on conflict (version) do nothing;
commit;"
  fi

  echo "→ $file"

  # Skip anything already recorded as applied.
  check=$(python3 -c 'import json,sys; print(json.dumps({"query": sys.argv[1]}))' \
    "select 1 from supabase_migrations.schema_migrations where version = '$version';")
  applied=$(curl -sS -X POST "https://api.supabase.com/v1/projects/$REF/database/query" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" --data "$check")
  if [[ "$applied" == *'"?column?":1'* ]]; then
    echo "  • already applied, skipped"
    continue
  fi
  body=$(python3 -c 'import json,sys; print(json.dumps({"query": sys.stdin.read()}))' <<<"$sql")
  response=$(curl -sS -w '\n%{http_code}' -X POST \
    "https://api.supabase.com/v1/projects/$REF/database/query" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    --data "$body")
  status="${response##*$'\n'}"
  payload="${response%$'\n'*}"

  if [[ "$status" != 2* ]]; then
    echo "  ✗ failed (HTTP $status):"
    echo "$payload"
    echo
    echo "Stopped. Nothing from $file was applied (it ran in one transaction)."
    exit 1
  fi
  echo "  ✓ applied"
done

echo
echo "All migrations applied."
