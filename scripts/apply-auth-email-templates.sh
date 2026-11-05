#!/usr/bin/env bash
# Pushes every auth email subject + template in supabase/templates/ to the
# hosted Supabase project that .env.local points at, in ONE PATCH to
# config/auth. supabase/config.toml only governs `supabase start`; this is how
# the deployed project gets the same emails.
#
# Only mailer_subjects_* and mailer_templates_*_content keys are sent. Never
# add smtp_* keys here: the API treats the SMTP settings as one unit, and a
# partial smtp_* PATCH wipes the rest (password included).
set -euo pipefail

cd "$(dirname "$0")/.."

TOKEN=$(grep '^SUPABASE_ACCESS_TOKEN=' .env.local | head -1 | cut -d= -f2- | tr -d '"')
REF=$(grep '^NEXT_PUBLIC_SUPABASE_URL=' .env.local | head -1 | sed -E 's#.*https://([a-z0-9]+)\..*#\1#')

if [[ -z "$TOKEN" || -z "$REF" ]]; then
  echo "SUPABASE_ACCESS_TOKEN or NEXT_PUBLIC_SUPABASE_URL missing in .env.local" >&2
  exit 1
fi

# key (as in mailer_subjects_<key> / mailer_templates_<key>_content) | file | subject
TEMPLATES='confirmation|confirmation.html|Your Field & Arena confirmation code
magic_link|magic-link.html|Your Field & Arena sign-in code
invite|invite.html|{{ if .Data.role }}You'"'"'ve been added as {{ .Data.role }}{{ if .Data.showName }} for {{ .Data.showName }}{{ end }}{{ else }}You'"'"'ve been invited to Field & Arena{{ end }}
recovery|recovery.html|Reset your Field & Arena password
email_change|email-change.html|Confirm your new email address
reauthentication|reauthentication.html|Your Field & Arena verification code
password_changed_notification|password-changed.html|Your password was changed
email_changed_notification|email-changed.html|Your email address was changed
phone_changed_notification|phone-changed.html|Your phone number was changed
identity_linked_notification|identity-linked.html|A new sign-in method was linked to your account
identity_unlinked_notification|identity-unlinked.html|A sign-in method was removed from your account
mfa_factor_enrolled_notification|mfa-factor-enrolled.html|A new verification method was added to your account
mfa_factor_unenrolled_notification|mfa-factor-unenrolled.html|A verification method was removed from your account'

body=$(TEMPLATES="$TEMPLATES" python3 - <<'PY'
import json, os, sys

body = {}
for line in os.environ["TEMPLATES"].splitlines():
    key, file, subject = line.split("|", 2)
    with open(os.path.join("supabase/templates", file), encoding="utf-8") as fh:
        content = fh.read()
    body[f"mailer_subjects_{key}"] = subject
    body[f"mailer_templates_{key}_content"] = content

bad = [k for k in body if not k.startswith("mailer_")]
if bad:
    sys.exit(f"refusing to send non-mailer keys: {bad}")
print(json.dumps(body))
PY
)

count=$(python3 -c 'import json,sys; print(len(json.loads(sys.stdin.read())))' <<<"$body")
echo "Project: $REF"
echo "Keys to update: $count (mailer_subjects_* and mailer_templates_*_content only)"
read -r -p "Apply the auth email templates to this project? [y/N] " answer
[[ "$answer" == "y" || "$answer" == "Y" ]] || { echo "Cancelled."; exit 0; }

response=$(curl -sS -w '\n%{http_code}' -X PATCH \
  "https://api.supabase.com/v1/projects/$REF/config/auth" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  --data-binary @- <<<"$body")
status="${response##*$'\n'}"
payload="${response%$'\n'*}"

echo "HTTP $status"
if [[ "$status" != 2* ]]; then
  echo "Failed:"
  echo "$payload"
  exit 1
fi
echo "Auth email templates applied."
