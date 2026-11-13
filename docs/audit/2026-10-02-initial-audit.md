# Field-Arena code audit: initial report

**Date:** 2026-10-02 · **Branch:** `new_design` (uncommitted work included) · **Audited by:** Claude (6 parallel reviewers + manual verification)

## Scope

All of `src/` (app, modules, shared), `supabase/migrations/` (RLS, functions, indexes) and the Stripe / Calendly webhooks. The review was split six ways:

1. Shows (setup, schedule, show manager)
2. Scoring, judging, operations
3. Riders, vendors, sales and payments
4. SuperAdmin, organizations, staff
5. Security and database (RLS, RPCs, grants)
6. App shell, shared, auth, marketing

## Automated checks

| Check | Result |
| --- | --- |
| `yarn typecheck` | ✅ 0 errors |
| `eslint src` | ✅ 0 errors, 0 warnings |
| `yarn lint` (whole repo) | ❌ 998 errors, all from `field-arena-prototype/*.js` (design folder not in the ESLint ignores) |
| Tests | None in the repo |

## Summary

| Severity | Count | Meaning |
| --- | --- | --- |
| 🔴 Critical | 6 | Data loss, money loss or privilege escalation reachable today |
| 🟠 High | 29 | Security hole or wrong results under normal use |
| 🟡 Medium | 38 | Bugs under specific conditions, races, rule violations |
| ⚪ Low | 24 | Hygiene, dead code, minor UX |

**What is solid:** RLS is enabled on every table. SECURITY DEFINER helpers pin `search_path`. The Stripe webhook verifies signatures. Impersonation and preview cookies are re-checked against the real role. No service-role code reaches the browser. Every `queries.ts` is `server-only`.

**Main themes:**
- **Column-level write control is missing.** Several RLS UPDATE policies allow any column to change, so users can edit fields they should not (email, permissions, fees, suspension).
- **Service-role actions skip tenant checks.** Some actions use the admin client after checking only "is an Organizer", not "owns this show".
- **Multi-step writes are not atomic.** Payment fulfilment, JSON documents and ride reordering are done as several separate writes.
- **Several values are stored in one format and read in another** (ticket close time, ride order vs scoring position).
- **There are no error boundaries,** so one failed query blanks the whole dashboard.

---

## 🔴 Critical

| # | Area | Issue | Where |
| --- | --- | --- | --- |
| C1 | Staff | **CSV staff import can create a SuperAdmin.** The `role` column is free text and is written straight into `users.platform_role` for new accounts. | `staff/schemas.ts:90`, `staff/data/mutations.ts:71,141-153` |
| C2 | Payments | **Order fulfilment is not atomic.** If it fails partway, created entries stay, the order goes back to `pending`, and the webhook retry creates them again (duplicates). | `riders/data/checkout.ts:636-650`, `api/webhooks/stripe/route.ts` |
| C3 | Shows | **Unticking a level in Select Events deletes classes that have paid entries,** and cascades to their scores. | `shows/data/mutations.ts:862-876` |
| C4 | Shows | **The ticket close time is ignored.** It is saved as `"YYYY-MM-DD HH:MM"` but parsed by splitting on `" · "`, so the time is lost and checkout stays open. | `shows/data/mutations.ts:810`, `riders/utils/parse-ticket-window.ts:18` |
| C5 | Scoring | **`scoring_pos` and `ride_order` disagree** (checkout writes 0-based, gaps appear after scratch, unfinish is wrong), so the judge can score the wrong rider. | `scoring/data/mutations.ts:442-447,749-752` |
| C6 | Scoring | **`advanceRide` ignores the class's test override,** so marks are stored against the wrong test. | `scoring/data/mutations.ts` |

## 🟠 High

### Security and permissions

| # | Issue | Where |
| --- | --- | --- |
| H1 | A user can change their own `users.email` and hijack a pending staff invite for that address. | RLS `users_update_self`; `staff/data/mutations.ts:111-121` |
| H2 | A Show Admin can grant themselves `canRefund` / `canViewMoney`, then refund or charge cards. | RLS `staff_assignments_write`; `staff/data/mutations.ts:378-392` |
| H3 | Any Organizer can approve or reject vendor bookings in **another org's** show (admin client). | `vendors/data/mutations.ts:612-627` |
| H4 | An Organizer can PATCH platform-only org columns: un-suspend, un-delete, fee model, holdback, payout cadence, Stripe account. | RLS `organizations_update_own` (no column grant) |
| H5 | `assign_bridle_number`, `resolve_show_entry_numbering` and `abandon_stale_orders` are SECURITY DEFINER with no auth check and are callable by anon. | `20260922123000_bridle_number_claim_rpc.sql`, `20260916120000_…` |
| H6 | `createOrganization` (and `sendLeadOnboarding`) has no `requireSuperAdmin`, so it leaks whether an email exists. | `superadmin/data/mutations.ts:79-106,735` |
| H7 | `updateRiderContactInfo` can edit **any** rider on the platform. | `staff/data/mutations.ts:311-330` |
| H8 | `startStripeConnect` has no role check, so a Show Admin can attach a payout account. | `organizations/data/mutations.ts` |
| H9 | Event Sales sends every order and amount to staff **without** `canViewMoney`; the data is hidden in the UI only. | `dashboard/event-sales/page.tsx:35-55` |
| H10 | `GET /api/scoring/[classId]` (polled every 4s) has no auth and does admin writes, overwriting a custom test and `ride_started_at`. | `api/scoring/[classId]/route.ts`, `scoring/data/queries.ts:84-157` |

### Payments

| # | Issue | Where |
| --- | --- | --- |
| H11 | Refunds don't use `reverse_transfer`, so the platform pays every refund out of its own balance. | `sales/data/mutations.ts:137-143` |
| H12 | "Charge more" uses `Date.now()` in its idempotency key (double charge on retry), has no amount cap, uses hardcoded `usd`, and has no `transfer_data`. | `sales/data/mutations.ts:181-192` |
| H13 | The webhook logs an amount mismatch, then returns 200 and fulfils anyway. | `api/webhooks/stripe/route.ts` |
| H14 | A vendor booking is re-priced at payment from mutable data. Items are not checked against the booking's show, and anon can add items to any pending booking. | `vendors/data/checkout.ts:37-64`, `20260810120000_vendor_public_apply.sql` |

### Data correctness

| # | Issue | Where |
| --- | --- | --- |
| H15 | Clearing the stable count wipes the whole stable chart. | `shows/data/mutations.ts` |
| H16 | Master schedule "move class to ring/day" ignores the day (`pinnedDay` is always null). | `shows/data/setup-queries.ts:1833` |
| H17 | SCR / ELIM results become `NaN` in Awards. | `shows/data/setup-queries.ts:1983` |
| H18 | JSON columns (stable chart, horse docs, show_details, schedule_prefs, runner_state) use read-modify-write, so concurrent edits overwrite each other. | `shows/data/mutations.ts` |
| H19 | `class_entries` reads are not paginated, so shows with more than 1000 entries are silently cut off (PostgREST `max_rows`). | `shows/data/*` |
| H20 | SuperAdmin aggregates are also capped at 1000 rows. | `superadmin/data/queries.ts` |
| H21 | Some fields call a server action on every keystroke with no rollback on error. | `class-divisions-card.tsx`, `required-documents-card.tsx`, `venue-card.tsx` |
| H22 | Renaming or deleting a division or ring leaves classes pointing at the old name. | `shows/data/mutations.ts` |
| H23 | `requireOrgId` ignores the org selected in the switcher, so writes go to the user's home org. | `organizations/data/*` |

### Scoring

| # | Issue | Where |
| --- | --- | --- |
| H24 | A class with no judges assigned auto-advances through every ride. | `scoring/data/mutations.ts` |
| H25 | Signed scoresheets are still editable, the signature is not cleared, and there is no lock. | `scoring/data/mutations.ts` |
| H26 | The announcer's "Now in ring" points at the wrong rider after a scratch (index mismatch). | `announcements/*` |

### App and auth

| # | Issue | Where |
| --- | --- | --- |
| H27 | There are no `error.tsx` / `global-error.tsx` / `not-found.tsx` files, and the dashboard layout awaits calls that can throw, so one failed query blanks every page. | `src/app/**`, `(dashboard)/layout.tsx` |
| H28 | "Forgot password" never lets the user set a new password; the reset link acts as a magic login. | `auth/data/mutations.ts:219`, `auth/confirm/route.ts` |
| H29 | Checkout return pages run payment confirmation during render and crash if payment is not yet `paid`. | `dashboard/vendor/page.tsx:26`, `rider/shows/[showId]/page.tsx:69` |

## 🟡 Medium (38)

**Security**
- Open redirect: `/\evil.com` passes `safeNext`, and the check is copied in six places.
- Read helpers in `'use server'` files trust a caller-supplied profile.
- The public demo form writes with the service-role key and has no rate limit.
- Anon vendor-booking insert has no column restriction.
- Staff with `canApproveDocuments` can rewrite any horse column, including `rider_id`.
- Staff invite email HTML is not escaped.
- Deleted or suspended orgs keep access.
- `canViewMoney` is derived from platform role instead of per-show permission.

**Payments**
- Order is abandoned at 6h but its Stripe session stays payable for 24h.
- A rejected vendor booking can still become `paid`.
- Add-on stock can be bypassed with duplicate lines or a race.
- Qualification types are not filtered by show or enabled flag.
- Rider number assignment can race.
- The webhook ignores refunds, disputes and expired sessions.
- Additional charges cannot be refunded.

**Scoring**
- The error count uses read-modify-write and can race.
- Debounced marks can be saved to the next rider, or lost on unmount.
- No server-side completeness check on submit.
- No completion check on publish results.
- Three different ranking functions are used.
- `getMyScoringPermissions` crashes when `maybeSingle` sees more than one row.
- A judge can be assigned to several seats.
- Duplicate or judge-less seats can be created.
- The scorecard averages unsubmitted sheets.
- 4s polling cost.

**Shows**
- The engine places rides past the end of the day.
- Money totals use the current fee and include scratched entries.
- Filing-cabinet reconcile runs a loop on GET.
- `reorderRide` does 2N sequential writes.
- Moving a class doesn't update its arena.
- RLS-blocked updates report success.

**App**
- The proxy writes `next` but nothing reads it, so deep links are lost.
- `getUser()` is called 4–6× per request with no `React.cache`.
- 21 server actions skip Zod (worst case: `advanceRunnerState` spreads raw input into JSON).
- `shared/lib` holds server actions that UI calls directly.
- 39 cross-module internal imports.
- Hydration mismatches (clocks, ticket URL, print dates).
- "Today" is computed in UTC in several places.
- Duplicate queries in `generateMetadata`.

## ⚪ Low (24)

**Security**
- Calendly webhook has no replay window.
- Waiver path is not limited to the show's folder.
- Any show participant can insert `merch_sales`.
- Vendors can read every org's venue library.
- `?error=` text is shown verbatim on login.
- `setPreviewShow` redirects to an unchecked URL.
- `setPassword` returns an unchecked `next`.

**Database**
- Missing indexes: `staff_assignments(lower(email))`, `vendor_bookings(lower(contact))`, `class_entries(horse_id)`, `organization_owners(user_id)`.
- Refund rollback has no compare-and-swap.

**Data**
- A new Stripe customer is created on every attempt.
- The vendor invoice uses the current price, not the price paid.
- Waiver date is client-supplied.
- Check-then-delete races.
- Blind stable status toggle.
- Results and Awards rank differently.
- Ties sort wrongly when `ctot` is null.
- `isSheetComplete` hardcodes 3 errors.

**Code health**
- Dead files: `stat-tile`, `dash-icon`, `role-rail`, 3 shadcn files, `console-icon`, `readiness-meter`, empty `ui-audit-preview/`, stray `//test` in `proxy.ts`.
- 5 pages call Supabase directly.
- Types are exported from `queries.ts`.
- "Recent organizers" on the SuperAdmin Overview is alphabetical, not newest first.
- The mobile preview remounts the shell.
- `useClock` hydration.
- `ilike` wildcards are not escaped.

---

## Fix plan

1. **Critical C1–C6.** Each is a small, targeted fix.
2. **High security H1–H10.** Mostly one migration (column grants, a trigger, RPC auth and revokes) plus tenant checks in actions.
3. **High payments H11–H14.** Stripe parameters, idempotency, mismatch handling.
4. **High data, scoring and app H15–H29.**
5. **Medium and Low,** as time allows; architecture items (cross-module imports, moving types) are left for a separate refactor.

After the fixes, the same reviewers run again and an **after report** is written next to this one.
