# Field-Arena code audit: after report

**Dates:** 2026-10-02 to 2026-10-05 · **Branch:** `new_design` (uncommitted) · **Initial report:** [2026-10-02-initial-audit.md](./2026-10-02-initial-audit.md)

## How this was done

1. **Round 1 fixes.** Six fix passes ran in parallel, one per area: shows, scoring, payments, staff/SuperAdmin, app/auth, and the database.
2. **Re-audit.** Three independent reviewers checked every finding by ID, read-only, and looked for new bugs the fixes introduced. The 13 new issues they found were fixed.
3. **Round 2 fixes.** Four passes fixed the remaining partial and open items.
4. **Round 3: architecture cleanup.** Module boundaries, layering and type locations were brought in line with `.claude/rules`.
5. Typecheck and lint were run again after each round.

## Automated checks

| Check | Before | After |
| --- | --- | --- |
| `yarn typecheck` | ✅ 0 | ✅ 0 |
| `yarn lint` (whole repo) | ❌ 998 errors (prototype folder) | ✅ 0 |
| Cross-module internal imports | 60 | **0** |
| UI files importing from `data/` | 117 | **0** |
| `src/shared` → `src/modules` imports | 2 | **0** |
| `'use server'` files in `src/shared` | 3 | **0** |
| Tests | none | none |

## Database migrations

Migrations 1–5 were applied to dev (`ehtmphqudvcupejxofoh`) on 2026-10-05 with `scripts/apply-audit-migrations.sh` and recorded in `supabase_migrations.schema_migrations`. Afterwards the live schema was checked: new functions, triggers and grants are in place, and `database.types.ts` was regenerated from it.

**Migration 6 still needs applying:** run `./scripts/apply-audit-migrations.sh` again. It skips the ones already applied.

| # | File | What it does |
| --- | --- | --- |
| 1 | `20261002120000_audit_security_fixes.sql` | Email lock, staff grant trigger, org column grants, RPC auth and revokes, vendor item checks, signed-sheet lock, horse update trigger, merch, venues, waiver path, indexes |
| 2 | `20261002130000_payments_followups.sql` | Vendor `review` status, checkout snapshot, `review_reason`, `refund_log` |
| 3 | `20261002131000_shows_followups.sql` | Atomic stable-chart, manual-horse and horse-doc patch functions; batched numbering reconcile; safe class delete |
| 4 | `20261002132000_scoring_followups.sql` | Error count kept in sync by a trigger |
| 5 | `20261002133000_admin_followups.sql` | Suspended or deleted orgs lose access (SuperAdmin keeps it) |
| 6 | `20261005121000_stable_toggle_precondition.sql` | Chart publish toggle checks the status the user saw |

The SQL was reviewed by reading it and checked against earlier migrations, but **it has never been run**. Errors on the first run are possible. Fix them and re-run.

**Two settings only the account owner can change:**
- **Stripe** webhook endpoint: enable `charge.refunded`, `charge.dispute.created` and `checkout.session.async_payment_failed`.
- **Supabase** Auth redirect URLs: add `<site>/set-password?mode=reset`.

## Scorecard

| Severity | Found | Fixed | Partial | Open |
| --- | --- | --- | --- | --- |
| 🔴 Critical | 6 | **6** | 0 | 0 |
| 🟠 High | 29 | **29** | 0 | 0 |
| 🟡 Medium | 38 | 36 | 2 | 0 |
| ⚪ Low | 24 | **24** | 0 | 0 |
| New (re-audit) | 13 | **13** | 0 | 0 |

## 🔴 Critical: all fixed

| # | Issue | Fix |
| --- | --- | --- |
| C1 | CSV import could create a SuperAdmin | Role is a closed list. Mapping to a platform role can only produce staff roles. |
| C2 | Non-atomic fulfilment caused duplicate entries | Fulfilment is idempotent per order. The webhook returns 500 on transient failure so Stripe retries. |
| C3 | Unticking a level deleted paid entries | Refused while any class has entries. The check and delete run in one SQL transaction. |
| C4 | Ticket close time was ignored | One shared parser reads all formats and uses the show's timezone. |
| C5 | Judge could score the wrong rider | The current ride is derived from the entries and shared by the judge screen, announcer and API. |
| C6 | Test override was ignored | One helper picks the effective test everywhere. |

## 🟠 High: all fixed

**Security:**
- H1: email lock
- H2: Show Admin self-grant (trigger + app + UI)
- H3: vendor approval scoped to the show
- H4: org platform columns
- H5: RPC auth
- H6: `requireSuperAdmin`
- H7: rider must be entered in the show
- H8: Stripe Connect is owner-only
- H9: sales redacted on the server
- H10: polled API needs auth and no longer writes

**Payments:**
- H11: the organizer bears the full refund (refund, then reverse exactly that amount from the transfer)
- H12: "charge more" (idempotency key, cap, currency, transfer)
- H13: amount mismatch sends rider orders and vendor bookings to review
- H14: vendors pay the price snapshotted at checkout, and items are checked against the show

**Data:**
- H15: stable count
- H16: master schedule day
- H17: SCR/ELIM no longer NaN
- H18: atomic JSON patches (runner state, show details, schedule prefs, stable chart, manual horses, horse docs)
- H19: pagination past 1000 rows
- H20: SuperAdmin lists paged
- H21: save on blur with rollback
- H22: division and ring rename/delete
- H23: the selected org is used

**Scoring:**
- H24: no judges means no auto-advance
- H25: signed-sheet lock
- H26: announcer (including work-ins)

**App:**
- H27: error boundaries
- H28: password reset
- H29: checkout return pages

## 🟡 Medium

**Fixed in round 2:**
- **Timezone:** "today", ticket close, schedule pace and document expiry now use the show's timezone (then the org's, then America/New_York).
- **Money totals:** paid lines count the amount actually charged, and scratched entries are excluded.
- **Blocked writes:** 28 more show writes now detect an RLS-blocked update instead of reporting success.
- **Error count:** kept in sync in SQL, so judge and scribe can't race.
- **Webhook:** now handles `charge.refunded`, disputes and `async_payment_failed`.
- **Add-on stock:** pending orders count towards stock, it is re-checked at fulfilment, and oversells are flagged.
- **Suspended or deleted orgs:** blocked, with a clear screen.
- **`canViewMoney`:** checked per show, not by role.
- **Duplicate queries in `generateMetadata`:** cached.
- **Polling:** backs off when nothing changes and pauses in hidden tabs.
- **Architecture:** cross-module imports, types in `data/`, server actions in `shared/` (see the counts above).

**Partial (2):**
- **Filing-cabinet reconcile:** now one batched call per page, but it still runs on page load. Moving it into checkout, CSV import and move-entry is the follow-up.
- **Schedule review fee totals:** `grossFees` and `platformFees` exclude scratched entries but still use the current fee. No screen shows them.

**Fixed on 2026-10-05:**
- **Refunding a "charge more" payment.** Each extra charge can now be refunded from the Event Sales refund dialog. Refund state is stored per charge (no migration). Refunds hold back the platform fee, like the original refund. Net revenue subtracts these refunds. The webhook syncs refunds made in Stripe.

## ⚪ Low

All fixed. The last two were fixed on 2026-10-05:
- **Waiver date:** set by the server in the show's timezone; the browser value is ignored.
- **Stable status toggle:** stall status and chart publish/unpublish only save if the status is still what the user saw (needs migration `20261005121000`).

Also fixed: on Live Scoring and judging-history class pages, the top show picker and breadcrumb now show the class's show and "Live Scoring".

## New issues from the re-audit: all fixed

| Sev | Issue | Fix |
| --- | --- | --- |
| High | The scoring pointer write always failed (trigger rejected the admin client) | Writes as the user, is best-effort, and the trigger lets service role through |
| High | Rider orders never stored the PaymentIntent, so every refund failed (this predates the audit) | Stored on claim, with a backfill |
| Medium | A Show Admin could re-point a staff row carrying money grants | Re-pointing counts as a new grant |
| Medium | A pinned day dropped rides that didn't fit and looped | A pin means "not before", and overflow spills forward |
| Medium | A seat holder could un-submit a signed sheet directly | Reopening needs canEditShow and a cleared signature |
| Medium | `startRide` worked on any org | Checked with `has_show_permission` |
| Low ×7 | Permission key missing from the resolver, legacy permission lock, charge retry after a decline, honeypot autofill, Calendly status reset, swallowed errors, empty score ranked as 0% | All fixed |

## Behaviour changes to know about

- Ring and division names and fees save when you leave the field, not on every keystroke.
- A Show Admin can no longer:
  - grant money or refund rights;
  - edit their own role or permissions;
  - grant permissions they don't hold.

  The UI shows these controls disabled, with a tooltip.
- Publishing results with unscored or unsigned rides asks for confirmation.
- A signed sheet must be reopened (canEditShow) before marks can change.
- Stripe Checkout sessions expire after 5 hours, and a new checkout expires the previous one.
- Refunds now come fully out of the organizer's payout. If that reversal fails, the sale is flagged "Needs review".
- Vendor bookings can be in a "Payment under review" state.
- Suspended or deleted orgs see a block screen.
- View-as actions (enter as organizer, exit, rail switch, show preview) show an error toast instead of an error page.
- The password reset link opens a "set new password" form.

## Not verified

Nothing was run in a browser or against Stripe or the database. Typecheck and lint pass. After the migrations are applied, a manual test pass is needed on:
- checkout, refunds and "charge more"
- judge scoring (advance, sign, reopen)
- staff permissions
- stable chart
- Select Events level toggle
- master schedule
- password reset
- the suspended-org screen
