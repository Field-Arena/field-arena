# Migration map — legacy → Next.js

Tracks what has moved from the legacy static/Vercel app to this codebase, screen
by screen and action by action.

Status values:

- **done** — migrated, reads and writes work against Supabase, verified in a browser
- **partial** — some of it works; the gaps are named
- **pending** — not started
- **dropped** — deliberately not carried over, with the reason

Last updated: 2026-07-27.

---

## Blockers that cap "working" regardless of build progress

| Blocker | Blocks |
|---|---|
| `STRIPE_SECRET_KEY` empty | rider checkout, vendor checkout, refunds, additional charges, Connect onboarding, payouts, settled revenue |
| `RESEND_API_KEY` empty | invite emails, entry confirmations, results emails, document reminders, onboarding emails |
| Docker not running | local Supabase (`supabase start`), `supabase db dump`, migration catalog caching. Remote push works fine |

Neither key is needed to *build* those features — the schema, fee formulas and
refund constraints are already in place — but nothing can transact or send until
they are set.

---

## Foundation

| Item | Status | Notes |
|---|---|---|
| Schema (31 domain tables + audit_log) | **done** | 32 tables live. `sessions` / `rider_sessions` / `password_hash` / `clerk_user_id` dropped — Supabase Auth owns credentials |
| RLS | **done** | 72 policies. Ports `authz.js` + `permissions.js`, including ShowAdmin being per-show not org-wide |
| Storage buckets | **done** | 6 buckets, policies scoped by object path. Upload UI is pending |
| pg_cron stale-order cleanup | **done** | Replaces the Vercel hourly cron |
| Domain-health cron | **pending** | Probed DNS via the Vercel API; Postgres cannot. Needs an Edge Function |
| Demo seed | **done** | 6 orgs, 12 shows, 40 classes, 400 entries / 200 riders. Idempotent (verified by re-running) |
| Auth | **done** | Email + password, `/login`, callback, middleware, sign-out |
| Role routing | **done** | All 9 roles resolve to a destination; unmigrated ones show an honest placeholder |
| Design tokens | **done** | Brand palette + workspace status palette as Tailwind tokens |
| shadcn | **done** | 14 components under `shared/ui/shadcn` |

---

## Roles

Legacy resolved post-login destinations through `PLATFORM_ROLE_TO_VIEW` in
`marketing-home.html`, which contained only three entries. Judge, Scribe,
Announcer, ShowStaff and Vendor each had a fully built view that login could not
reach. All nine are routed here.

| Role | Legacy view | Lines | Status |
|---|---|---|---|
| SuperAdmin | `superadmin.html` | 3,176 | **partial** |
| Organizer | `showstaff.html` | 14,629 | **pending** |
| ShowAdmin | `showstaff.html` (money hidden) | shared | **pending** |
| ShowStaff | `showstaff-ops.html` | 1,207 | **pending** |
| Judge | `judge-scribe.html` | 767 | **pending** |
| Scribe | `judge-scribe.html` (scoped) | shared | **pending** |
| Announcer | `announcer.html` | 656 | **pending** |
| Vendor | `vendor.html` | 775 | **pending** |
| Rider | `rider.html` | 2,893 | **pending** |
| Volunteer | — | — | **dropped** — in the legacy README and ARCHITECTURE role lists but in no API code, schema constraint or view. Never implemented |

---

## SuperAdmin console — action by action

| Action | Status | Notes |
|---|---|---|
| Clients — Organizers list | **done** | Real rows. Shows, distinct riders, estimated revenue derived per org |
| Organizer search | **done** | Driven by a `q` parameter so the table stays a Server Component |
| Onboard / Pending badge | **done** | Derived from whether an Organizer account accepted |
| Suspended / Deleted / Demo badges | **done** | |
| **+ Add Organizer** | **done** | Creates org + owner invite. No email sent (Resend unset) |
| **Edit** organizer | **done** | name, email, phone, website, city, region, country, fee model |
| **Suspend / Reactivate** | **done** | Verified: writes the row, audit trigger records actor + before/after |
| **Delete / Restore** | **done** | Soft delete. Legacy confirmation wording kept verbatim |
| **Resend Invite (All Pending)** | **partial** | Extends invites 7 days; cannot email |
| **Enter as organizer** (impersonation) | **pending** | Needs the organizer workspace to accept an org context |
| Sales Funnel | **partial** | Lead list + pipeline totals read. Add/edit lead, demo scheduling, onboarding checklist pending |
| Scoring Catalog | **partial** | Reads real rows — was a hardcoded array with no backend. Editor pending |
| Documents | **partial** | Lists `catalog_documents`. Upload/delete pending |
| Billing | **partial** | Fee model + worked fee example real. Payouts/Connect/settlement need Stripe |
| Users | **done** | Accounts + pending invites |
| Organizer Staff Directory | **pending** | |
| "Experience as" embedded role apps | **dropped** | Legacy embedded four whole apps as a 441 KB base64 blob. Real routes replace it |
| Signup Flow Preview / Demo | **dropped** | Static walkthroughs of screens becoming real routes; a preview copy would need maintaining in parallel |

---

## Organizer workspace (`showstaff.html`) — pending

The largest single item, ~40 render functions. Surface, from its own function
names:

Setup · ShowManager picker · Divisions · Add-ons · Qualifying types · Merch ·
Document requirements · Expenses · Locations & stabling config · Ring config ·
Ring assignments · Schedule · Calendar · Focus view · Events view · Review view ·
Rider entries · Results · Qualifying report · Division board · EventSales ·
Merch checkout · Billing (+ expenses & P&L) · Member database · Documents ·
KPIs · Next-steps checklist · ShowRunner · Add open ride

Currently `/dashboard` renders **static mock data** from
`src/modules/staff/constants.ts` (115 riders, 226 entries, $21,690). Nothing on
it reads Supabase yet.

---

## Backend API — 54 resource actions, none ported

Legacy routed everything through three fat dynamic handlers. Equivalent work here
becomes Server Actions in each module's `data/` layer.

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

**Webhooks**: `stripe-webhook`, `calendly-webhook` — both **pending**

**Auth endpoints** (`auth/[action]`, `invites/[token]`) — **dropped**, replaced by
Supabase Auth. The `invites` table survives because it records *what role for
which show*, which Supabase's own invite has no concept of.

---

## Other pages

| Page | Lines | Status |
|---|---|---|
| `marketing-home.html` | 1,430 | **done** |
| `platform.html` | 305 | **done** — replaced by role routing |
| `showbuilder.html` | 2,744 | **pending** — show creation wizard |
| `showrunner-scoring.html` | 2,123 | **pending** — live multi-judge scoring |
| `learning/*` (9 SEO pages) + `learning-center.html` | 2,300 | **pending** |
| `organizer-onboarding.html` | 294 | **pending** |
| `accept-invite.html` | 251 | **pending** |
| `privacy-policy.html` / `terms-of-service.html` | 373 | **pending** |
| `vendor-apply.html` | 174 | **pending** |
| `entry.html` | 86 | **pending** |

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
