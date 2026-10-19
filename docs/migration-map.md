# Migration map — legacy → Next.js

Tracks what has moved from the legacy static/Vercel app to this codebase, screen
by screen and action by action.

Status values:

- **done** — migrated, reads and writes work against Supabase, verified in a browser
- **partial** — some of it works; the gaps are named
- **pending** — not started
- **built** — the route / action exists in this codebase, but this map has not
  re-verified it end to end in a browser since the status was set
- **dropped** — deliberately not carried over, with the reason

Last updated: 2026-07-27. Statuses refreshed from the code on 2026-10-19
(audit follow-up): anything that moved from pending/partial to **built** was
checked only for the existence of its routes and server actions, not
re-tested. Re-verify before relying on a row.

---

## Environment each deployment needs

Stripe and Resend are wired in (checkout, Connect, refunds, additional charges,
webhooks; invite / receipt / reminder / refund emails). Each environment still
needs its own keys — see `.env.local.example`:

| Variable                                     | Without it                                                                        |
| -------------------------------------------- | --------------------------------------------------------------------------------- |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | no checkout, refunds or webhook fulfilment                                        |
| `RESEND_API_KEY`                             | emails are skipped (sendEmail returns false)                                      |
| `NEXT_PUBLIC_SITE_URL`                       | required on Vercel production (the app throws); previews use their deployment URL |

Local Supabase (`supabase start`) still needs Docker.

---

## Foundation

| Item                                  | Status      | Notes                                                                                                                      |
| ------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------- |
| Schema (31 domain tables + audit_log) | **done**    | 32 tables live. `sessions` / `rider_sessions` / `password_hash` / `clerk_user_id` dropped — Supabase Auth owns credentials |
| RLS                                   | **done**    | 72 policies. Ports `authz.js` + `permissions.js`, including ShowAdmin being per-show not org-wide                          |
| Storage buckets                       | **done**    | 6 buckets, policies scoped by object path. Upload UI is pending                                                            |
| pg_cron stale-order cleanup           | **done**    | Replaces the Vercel hourly cron                                                                                            |
| Domain-health cron                    | **pending** | Probed DNS via the Vercel API; Postgres cannot. Needs an Edge Function                                                     |
| Demo seed                             | **done**    | 6 orgs, 12 shows, 40 classes, 400 entries / 200 riders. Idempotent (verified by re-running)                                |
| Auth                                  | **done**    | Email + password, `/login`, callback, middleware, sign-out                                                                 |
| Role routing                          | **done**    | All 9 roles resolve to a destination; unmigrated ones show an honest placeholder                                           |
| Design tokens                         | **done**    | Brand palette + workspace status palette as Tailwind tokens                                                                |
| shadcn                                | **done**    | 14 components under `shared/ui/shadcn`                                                                                     |

---

## Roles

Legacy resolved post-login destinations through `PLATFORM_ROLE_TO_VIEW` in
`marketing-home.html`, which contained only three entries. Judge, Scribe,
Announcer, ShowStaff and Vendor each had a fully built view that login could not
reach. All nine are routed here.

| Role       | Legacy view                     | Lines  | Status                                                                                                                          |
| ---------- | ------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| SuperAdmin | `superadmin.html`               | 3,176  | **partial**                                                                                                                     |
| Organizer  | `showstaff.html`                | 14,629 | **built**                                                                                                                       |
| ShowAdmin  | `showstaff.html` (money hidden) | shared | **done**                                                                                                                        |
| ShowStaff  | `showstaff-ops.html`            | 1,207  | **done**                                                                                                                        |
| Judge      | `judge-scribe.html`             | 767    | **done**                                                                                                                        |
| Scribe     | `judge-scribe.html` (scoped)    | shared | **done**                                                                                                                        |
| Announcer  | `announcer.html`                | 656    | **done**                                                                                                                        |
| Vendor     | `vendor.html`                   | 775    | **done**                                                                                                                        |
| Rider      | `rider.html`                    | 2,893  | **built** — `/rider`, `/rider/shows/[showId]`                                                                                   |
| Volunteer  | —                               | —      | **dropped** — in the legacy README and ARCHITECTURE role lists but in no API code, schema constraint or view. Never implemented |

---

## SuperAdmin console — action by action

| Action                                 | Status      | Notes                                                                                                  |
| -------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------ |
| Clients — Organizers list              | **done**    | Real rows. Shows, distinct riders, estimated revenue derived per org                                   |
| Organizer search                       | **done**    | Driven by a `q` parameter so the table stays a Server Component                                        |
| Onboard / Pending badge                | **done**    | Derived from whether an Organizer account accepted                                                     |
| Suspended / Deleted / Demo badges      | **done**    |                                                                                                        |
| **+ Add Organizer**                    | **done**    | Creates org + owner invite; emails the invite when `RESEND_API_KEY` is set                             |
| **Edit** organizer                     | **done**    | name, email, phone, website, city, region, country, fee model                                          |
| **Suspend / Reactivate**               | **done**    | Verified: writes the row, audit trigger records actor + before/after                                   |
| **Delete / Restore**                   | **done**    | Soft delete. Legacy confirmation wording kept verbatim                                                 |
| **Resend Invite (All Pending)**        | **built**   | Extends invites and re-sends the email                                                                 |
| **Enter as organizer** (impersonation) | **built**   | View-as cookie, re-validated server-side                                                               |
| Sales Funnel                           | **built**   | Lead CRM: add/edit, Calendly demo booking, checklist, onboarding email                                 |
| Scoring Catalog                        | **built**   | Reads and edits `scoring_catalog`                                                                      |
| Documents                              | **built**   | Upload, move, rename, delete `catalog_documents`                                                       |
| Billing                                | **built**   | Fee model, per-org billing, Connect status read live from Stripe                                       |
| Users                                  | **done**    | Accounts + pending invites                                                                             |
| Organizer Staff Directory              | **built**   | Add staff, change role / permissions, remove                                                           |
| "Experience as" embedded role apps     | **dropped** | Legacy embedded four whole apps as a 441 KB base64 blob. Real routes replace it                        |
| Signup Flow Preview / Demo             | **dropped** | Static walkthroughs of screens becoming real routes; a preview copy would need maintaining in parallel |

---

## Organizer workspace (`showstaff.html`) — built

The largest single item, ~40 render functions. Surface, from its own function
names:

Setup · ShowManager picker · Divisions · Add-ons · Qualifying types · Merch ·
Document requirements · Expenses · Locations & stabling config · Ring config ·
Ring assignments · Schedule · Calendar · Focus view · Events view · Review view ·
Rider entries · Results · Qualifying report · Division board · EventSales ·
Merch checkout · Billing (+ expenses & P&L) · Member database · Documents ·
KPIs · Next-steps checklist · ShowRunner · Add open ride

`/dashboard` and the show manager read Supabase. The old static mock
constants (115 riders, 226 entries, $21,690) were removed from
`src/modules/staff/constants.ts` on 2026-10-19.

---

## Backend API — 54 resource actions, ported as Server Actions

Legacy routed everything through three fat dynamic handlers. The equivalent
work lives in Server Actions in each module's `data/` layer (not re-audited
action by action against the list below).

**`shows/[id]/[resource]`** (22): addons, classes, divisions, documents, logo,
merch-sales, move-entry, my-open-classes, orders, qualtypes, remind-documents,
roster, scoring, sheets, showimage, staff, vendor-apply, vendoritems, vendormap,
vendors

**`rider/[resource]`** (15): checkout-quote, checkout-confirm,
checkout-session-create, checkout-session-confirm, entries, horses,
horse-document, verify-horse-document, orders, scorecard, show, stabling, waiver,
me, logout

**`organizations/[id]/[resource]`** (17): all-staff, all-vendors,
billing-summary, connect, locations, members, org, org-billing, shows,
staff-assignments, stripe-status, test-templates, vendor-agreement,
vendor-bookings, vendor-checkout-quote, vendor-checkout-confirm, vendor-document

**Webhooks**: `stripe-webhook`, `calendly-webhook` — both **built** (`/api/webhooks/stripe`, `/api/webhooks/calendly`, signature-verified)

**Auth endpoints** (`auth/[action]`, `invites/[token]`) — **dropped**, replaced by
Supabase Auth. The `invites` table survives because it records _what role for
which show_, which Supabase's own invite has no concept of.

---

## Other pages

| Page                                                | Lines | Status                                                          |
| --------------------------------------------------- | ----- | --------------------------------------------------------------- |
| `marketing-home.html`                               | 1,430 | **done**                                                        |
| `platform.html`                                     | 305   | **done** — replaced by role routing                             |
| `showbuilder.html`                                  | 2,744 | **built** — `/dashboard/shows/new`, select events, test builder |
| `showrunner-scoring.html`                           | 2,123 | **built** — `/dashboard/scoring/[classId]`                      |
| `learning/*` (9 SEO pages) + `learning-center.html` | 2,300 | **built**                                                       |
| `organizer-onboarding.html`                         | 294   | **built** — `/onboarding`                                       |
| `accept-invite.html`                                | 251   | **built** — `/auth/confirm` → `/set-password`                   |
| `privacy-policy.html` / `terms-of-service.html`     | 373   | **built** — wording still needs legal review                    |
| `vendor-apply.html`                                 | 174   | **built** — `/vendor-apply/[showId]`                            |
| `entry.html`                                        | 86    | **pending** — not checked in this refresh                       |

---

## Deliberate departures from legacy

Recorded so they are not mistaken for oversights.

1. **`class_entries.order` → `ride_order`.** `order` is reserved; the legacy
   schema had already set this precedent renaming `group` → `group_name`.
2. **Refund cap, DQ-reason, horse-name immutability and single-identity are now
   database constraints.** Legacy enforced them in application code only — and had
   a concurrency test precisely because two simultaneous refunds could both pass
   an application-level check.
3. **Storage policies are path-scoped.** The pre-existing version granted every
   authenticated user read on every bucket, which would have let any rider read
   another rider's veterinary documents.
4. **Revenue is split into "estimated" and "settled".** Legacy showed
   `entries × avgEntryValue` as revenue; that estimate is kept and labelled, with
   settled revenue summed from paid orders separately.
5. **The role rail is a switcher for SuperAdmin only.** In legacy it lived in the
   demo shell where every icon was clickable; that would be privilege escalation
   in the real app.
6. **No `entries_count` column.** Counts are derived. The legacy schema's own
   comment called that column a placeholder for a computed count.
