# Parity findings — running log

Legacy: `field-and-arena-main` · New: `Field-Arena`
Audit is incremental. **Status of every item is recorded per module below.**

Legend — **DONE** = fixed & verified (uncommitted) · **OPEN** = needs a decision
· **TODO** = not audited yet, nothing known either way

---

## 0. Environment / infra

| Item | Status | Notes |
|---|---|---|
| `users.onboarded_at` migration `20260831120000` unapplied on remote | **DONE** | Applied via psql; ledger row inserted; schema cache reloaded |
| `.env.local` line 40 `//////prod//////` broke Supabase CLI | **DONE** | Changed to `#` |
| `STRIPE_SECRET_KEY` not set | **OPEN** | 3 orgs have Connect accounts; billing shows "Could not load Stripe status" until set. Expected, not a bug |

---

## 1. SuperAdmin module — audited in full

48 parity items found. 46 met (12 already correct, **34 fixed by me — uncommitted**).

| Item | Status | Notes |
|---|---|---|
| 19 × missing `requireSuperAdmin()` on Server Actions | **DONE** | Organizers could un-suspend/un-delete themselves, rewrite own `fee_model`/`holdback_percent` |
| Bulk "Resend invite (all pending)" missing | **DONE** | |
| Onboarding email was a no-op that still stamped "emailed" | **DONE** | Now really sends |
| Stripe status was a boolean off a column (no API call) | **DONE** | 5 real states restored |
| Payout history was a placeholder | **DONE** | |
| Pending-payouts stat hardcoded `$0` | **DONE** | |
| "Preview as judge" + DR123 scoring math missing | **DONE** | |
| Freestyle / Weighted / Placing sheet editors missing | **DONE** | 3 of 4 families absent |
| Provenance flag not editable | **DONE** | |
| Catalog collectives never reached scoring engine (no `key`/`label`) | **DONE** | |
| Doc matcher exact-only (was 3-tier) | **DONE** | |
| "Try to match again" / "Move all non-matching" missing | **DONE** | |
| Delete-document had no confirmation (3 places) | **DONE** | |
| Suspend had no confirmation | **DONE** | Contradicted own UC-004 |
| Judge/Scribe preview showed fabricated demo data | **DONE** | Now real per-show preview |
| Org shows browser / rider roster / onboarding preview missing | **DONE** | |
| SuperAdmin couldn't delete a live/on-sale show | **DONE** | Role split legacy documented but couldn't build |
| Calendly retries blanked existing lead data | **DONE** | |
| Multi-role rail: SuperAdmin-added staff never got `user_id` | **DONE** | |
| **Edit-Organizer pre-fills email/phone/website/country blank** | **OPEN** | Saving can null fields the admin never saw. Real bug, unfixed |
| **Owner provisioning (B9)** | **OPEN** | Legacy deliberately did NOT pre-create the `users` row. Needs confirmation Supabase blocks password-signup on invited-unaccepted email |
| **Experience-as-rider (B25)** | **OPEN** | Linked to public show page instead of rider impersonation — separate auth realm |

---

## 2. Money / Sales / P&L — audited in full

| Item | Status | Notes |
|---|---|---|
| `calcPlatformFee` / `calcPlatformFeeFlat8` formulas | ✅ exact port | GMO 18%, $7.99 floor, 8%, flat-8 split all correct |
| Fee rule applied to right item types (server) | ✅ correct | |
| **Refund/charge cross-tenant gap** | **DONE** | Any Organizer could refund another org's sale; service-role client meant no RLS backstop |
| **GMO cart-preview drift** | **DONE** | Rider quoted $108, charged $118 on a $100 GMO entry |
| Missing paid-status precondition on refund | **DONE** | |
| **P&L counted refunded money as revenue** | **DONE** | Raw `status` never changes on refund |
| Event Sales vs P&L disagreed on same show | **DONE** | Unified on shared `netCollected()` |
| **P&L vendor revenue always $0** | **DONE** | Filtered `status='confirmed'` — doesn't exist in this schema (`approved`→`paid`) |
| Expense defaults, gross-revenue basis, `net = rev − exp` | ✅ match | 15 default lines identical |
| Breakdown re-prices at current class fee | ✅ shared quirk | Legacy does the same (`esProductStats:7249`). Not a gap — but it does mean editing a class fee changes historical revenue |
| **Refund over-cap behaviour** | **OPEN** | Legacy silently capped; new rejects. Product decision. Check "refund every item" doesn't hard-fail mid-batch |

> ⚠️ **`'confirmed'` mistranslation may be wider.** Legacy vendor vocabulary was
> `confirmed`; this schema uses `approved → paid`. I fixed 3 occurrences in the
> money paths only. **Worth sweeping the rest of the codebase.**

---

## 3. Organizer workspace — NOT YET AUDITED

`showstaff.html` is ~700 functions. Only the money surface is done. Everything
below is **TODO — no findings either way**, listed in the risk order I'd take:

| Area | Legacy refs | Status |
|---|---|---|
| Entries / Results / Awards / Qualifying report | `renderResults`, `renderDivBoardFor`, `renderQualReportView` | **TODO** |
| Setup cards (Divisions, Add-ons, Qual types, Merch, Docs, Waiver, Vendor spaces, Ticket window, Branding) | `renderSm*` family | **TODO** |
| Schedule engine / Ring config / Master schedule / Focus / Events / Review | `renderScheduleNavView`, `buildMasterSchedule` | **TODO** |
| Members / Users / Documents / Venues / Stabling | `renderMemberDb`, `renderUserDirectory`, `renderLocations` | **TODO** |
| ShowRunner / live scoring ops | `renderShowRunner`, `sr*` family | **TODO** |
| KPIs / Next-steps checklist / Division board | `renderKpis`, `dashboardNextSteps` | **TODO** — no name matches found in new app; **not confirmed missing** |

---

## 5. Show Admin — money gating (audited in full)

RLS enforcement **verified live** by running queries as real staff users with
their JWT claims set (rolled-back transactions):
`can_view_money=false` → 0 rows on orders / vendor_bookings / merch_sales.
Genuine DB-level enforcement, not UI-only.

Note: "Viewing as → Show Admin" is a cookie on the Organizer's **own** session —
the DB identity never changes, so RLS cannot apply to it. Legacy behaves the
same way. Not a finding; it is a preview, not a privilege drop.

| Item | Status | Notes |
|---|---|---|
| Orders / vendor bookings / merch / Billing route / P&L / refunds | ✅ parity | RLS-enforced, verified live |
| **Event Sales had no `canViewMoney` gate at all** | **DONE** | Real Show Admin was saved only by RLS; **preview mode showed real money** (legacy hid it). Now gated |
| **Paid/Unpaid pill lost** | **DONE** | Legacy `moneyCell(amount,isPaid)` swapped the amount for a Paid/Unpaid pill; new dropped the column, losing the settled signal |
| **CSV export leaked `amountTotal`** | **DONE** | Export button now follows the same gate (legacy hid its report buttons the same way, `:14302`) |
| **Column-level REVOKEs are inert** | **DONE** | `20260727120900_rls.sql:710-712` revokes are overridden by table-level SELECT. `stripe_connect_account_id` readable by **all staff**; `orders.stripe_customer_id` readable by money staff. Fix: `20260907120000_fix_money_column_privileges.sql` |
| **Settlement terms readable by all staff** | **DONE** | `payout_cadence` / `holdback_percent`, no legacy precedent, never gated. Same migration |
| `classes.fee`, `add_ons.price`, `vendor_items.price`, `qual_types.price`, `shows.expenses` readable at DB | ⚠️ UI-only | **Legacy identical** — parity holds. Informational |
| Merch sales | 🔄 new is **stricter** | Legacy `GET /merch-sales` had no gate at all; new requires `canViewMoney` |
| Non-money surfaces (Setup, Divisions, Schedule, Entries, Results, Documents, Members) | ✅ parity | Show Admin differs from Organizer **only** in money |

> **Applied and verified.** `20260907120000` is in the migration ledger; all 4
> protected columns now return `permission denied` for an ordinary staff
> session, while normal columns and the service-role client are unaffected.
> Prerequisite already done: `getOrganizationBillingDetail` now reads settlement
> terms via the admin client (it read them via the user client, which the
> migration would have broken).

---

## 6. Show Operations (ShowStaff) — audited in full

**Permissions: zero findings — cleanest module audited.** The legacy carve-out
(`resource.js:272-274` allows POST /documents *only* for ShowStaff, while
`permissions.js:51` gives `ShowStaff: {}`) is reproduced exactly by migration
`20260806150000`. Verified live as `showstaff@fieldarena-demo.test`, comparing
*visible* vs *written* row counts to distinguish RLS denial from empty results:

| Operation | Result |
|---|---|
| documents INSERT | ALLOWED (the carve-out) |
| documents UPDATE / DELETE | visible=1, written=0 → RLS-denied |
| shows UPDATE | visible=1, written=0 → RLS-denied |
| class_entries UPDATE (scratch) | visible=80, written=0 → RLS-denied |
| classes / staff_assignments INSERT | DENIED (RLS) |
| orders / vendor_bookings / merch_sales | 0 rows |
| organizations settlement cols | 403 |

> Credential note: `sam.whitfield@fieldarena-demo.test` **does not exist**. The
> real account for those two shows is `showstaff@fieldarena-demo.test`.

| Item | Status | Notes |
|---|---|---|
| Ring status, ride order, schedule, find, riders, horses, stabling, vendors, documents | ✅ parity | |
| **Top-10 best scores by discipline** | **DONE** | Built `/operations/results`. Filter applied *before* the top-10 slice, matching legacy `:498` |
| **Past-show results archive** | **DONE** | `listPastShowResults()` — scoped to the staffer's own assignments, shows with no scored ride excluded, matching legacy `:394` |
| **Live clock strip** | **DONE** | `OpsClock`, `useSyncExternalStore` (no hydration mismatch) |
| **On-time / behind badge** | **NOT BUILT — deliberate** | Legacy computes this only in demo mode: `ringState():558` sets `delta = isRealMode ? {} : {...}`, so with real data it is **always ±0m**. Comment says "we don't fabricate a minutes-behind number we can't know." Building it would invent a feature legacy never had. A real version is possible via `class_entries.ride_started_at` vs scheduled time — **new feature, needs a decision** |
| **Score detail modal** | **DONE** | Ported faithfully: clicking a score opens rider/horse/class + final score + legacy's real-mode refusal line pointing at the judge/scribe app (`:615-626`). Inert when the class is unknown, matching `scoreLink`'s `if(!cls)` guard (`:694`). Wired at the 3 of legacy's 4 sites FA has: leaderboard, placings, ride order |
| Document delete / event-tagging | ✅ parity | Legacy's were local-only (`:883`, `:892`) and never persisted. New omits them rather than reproducing the illusion |

### 6b. Second-pass findings (caught by another agent's review, verified by me)

My first Show Ops pass **missed two real defects.** Both confirmed against live data:

| Item | Status | Notes |
|---|---|---|
| **Scratched riders leaked onto the ops board** | **DONE** | `getRingStatus` filtered `!holding` only, not `status='scratched'`. A scratched rider could render as "Now in ring"/"Next up" and inflated `entryCount`. Live proof: Peachtree Summer Classic → First Level Test 1 showed **10**, real count **9**. FA's own `listSchedule` already filtered correctly, so the two views contradicted each other |
| **No live refresh** | **DONE** | Legacy `setInterval(loadRealOps, 10000)` (`:378`); FA was server-rendered with no revalidation, so the board went stale mid-show. Added `OpsAutoRefresh` (10s `router.refresh()`, pauses when the tab is hidden) |
| **Ring board listed per class, not per ring** | **DONE** | Legacy `ringState():552` dedupes to arenas, one card per ring. FA rendered one row per class — a 30-class show became a 30-row wall. Added `groupRingsForBoard` |
| **Horses KPI was one number** | **DONE** | Legacy showed `today / total` (`:1189`). Added `getHorseCounts` |
| Placings: legacy top-8, FA full list | ✅ keep FA | `RibbonSwatch` already caps ribbons at eligible places, so FA's list is a superset, not a defect |

> Note for future passes: the ops board and the Schedule tab read entries through
> **two different queries** (`getRingStatus` in the announcements module vs
> `listSchedule` in operations). They must filter identically — this is exactly
> where the scratched bug came from.

---

## 7. Judge + Scribe — audited in full (fixes applied, uncommitted)

Four gaps found, all the same shape: a rule correctly written in a Server Action
but never mirrored into RLS. All four are now closed at the database.

| # | Finding | Legacy ref | Status |
|---|---|---|---|
| J1 | Anyone with `canEnterScores` could set `signed_by` — i.e. sign as the judge | `[resource].js` submit guard | DONE — `20260907130000` trigger: only the judge on that seat may sign |
| J2 | Ride actions (skip/scratch/eliminate/reorder) were OR'd into one permission | `permissions.js` per-action grants | DONE — same migration, per-action gate. `ride_order` deliberately `canSkip OR canEditShow` so the organizer draw reorder still works |
| S1 | A Scribe could overwrite a judge-entered mark | `[resource].js:1229` (409) | DONE — `20260907140000`, caller role resolved from `class_panel`, not trusted from the payload |
| S2 | Error-of-course toggle was gated on the sheet-level lock, not per-mark ownership | `showrunner-scoring.html:1273` | DONE — `test-sheet.tsx` now uses `isLockedFor()` |
| J5 | **Seat ownership was app-layer only.** Legacy refused a write to a seat you don't hold, server-side (`[resource].js:1194-1201`). FA enforced it only in `assertSeatAccess()`; `scores_write` checks nothing but `canEnterScores`, which Judge and Scribe both hold by default, so a direct PostgREST write bypassed it. Reproduced: the demo scribe (J1) wrote `final_remarks` to J2. `20260907140000` did NOT cover this — its `if caller is distinct from 'scribe' then return new` lets a caller with no relationship to the seat through. | DONE — `20260907160000`, trigger on INSERT+UPDATE. Verified: exploit refused via both direct UPDATE and `merge_score_json`; own seat still writable; organizer bypass intact; a synthesised two-seat holder can write BOTH seats (legacy semantics, not just the first) |
| J6 | Note, not fixed: `assertSeatAccess()` compares against `getMySeat()`, which returns only the FIRST seat a person holds — so the app layer is stricter than legacy for a multi-seat judge. The new trigger deliberately does not inherit this. No multi-seat holder exists in the data today. | OPEN — app-layer, latent |

TODO — not verified: panel-status / all-judges-ready logic. ~115 of ~140 functions
in `showrunner-scoring.html` remain unread.

## 8. Announcer — audited in full (fixes applied, uncommitted)

Legacy `announcer.html` is 656 lines but most of it is a **self-contained demo**
(fake roster, fake clock, a local timer that invents scores with
`64 + Math.random()*10`). Only the `isRealMode` branch is real behaviour, so
parity is judged against that branch alone — several things that look missing in
FA were demo-only in legacy and are correctly absent: rider hometown, sponsor
tag, the "Mark as announced" checkbox, the ride countdown, the ahead/behind
schedule chips.

| # | Finding | Legacy ref | Status |
|---|---|---|---|
| A1 | **No live refresh** — legacy polled `/scoring` every 4s; FA was a one-shot server render | `announcer.html:424` | DONE — `AnnouncerAutoRefresh` (4s, pauses on hidden tab) on the board + results |
| A2 | `listMyShows` had **no `role='Announcer'` filter** — a Judge+Announcer got their judging shows on the announcer board | `announcer.html:613` (`&role=Announcer`) | DONE — proven in a rolled-back txn: 3 shows before, 2 after |
| A3 | **Wrong show on a show day** — `start_date desc` put the furthest-FUTURE show at `shows[0]` | `announcer.html:624-627` | DONE — status derived from show dates, today-first ordering. Pinned to Peachtree's show day: was Blue Ridge, now Peachtree |
| A4 | Up Next truncated to 3 | `announcer.html:450` showed the whole remaining order | DONE — `UP_NEXT_DEPTH = Infinity`, rendered as a full queue list |
| A5 | No Schedule tab | `announcer.html:504` (hardcoded `8:00 AM - 5:00 PM` stub) | DONE — real per-class date/time/ring from `classes` |
| A6 | No History tab | `announcer.html:525` (real mode printed the literal string `undefined`) | DONE — completed shows with class + scored-ride counts |
| A7 | Documents opened in a new tab | `announcer.html:558` embedded the PDF inline | DONE — inline `<iframe>` + new-tab fallback |
| A8 | `role-workspaces.ts` advertised a "mark-as-announced checklist" that never existed in FA | — | DONE — copy corrected |
| A9 | **Live results gave SCR/ELIM a placing** — sorted to 0 but still numbered | `judge-scribe.html:421` filters both out before ranking | DONE — excluded before ranking |
| A10 | **No shared-rank tie handling** — `place = index + 1`, so two riders on the same % got 1st and 2nd | app-wide rule (`withSharedRank`, awards-engine, operations) | DONE — reuses `withSharedRank`; verified 71.2 -> 1st, 68.5/68.5 -> 2nd/2nd |

A9 and A10 came from a second agent's audit and were **not** in my own first pass —
both confirmed real before fixing. A2 and A3 were in mine and not theirs.

Different-but-defensible (not bugs):
- Results is a **leaderboard**; legacy real-mode was a recency feed of
  just-confirmed rides. FA is a superset for announcing placings.
- FA reads real Contacts from `staff_assignments`; legacy's Contacts tab was
  hardcoded demo data even in real mode.
- FA documents follow the **selected** show; legacy always used `rows[0].showId`.
- Read-only is **enforced in RLS**, not by a role check: `Announcer` role
  defaults are `{}` so `canEnterScores` is false -> `scores_write` /
  `class_entries_write` both deny. Legacy hard-403'd every non-GET for an
  Announcer regardless of grants; FA would allow it if an organizer explicitly
  granted `canEnterScores`. Deliberate model difference, not a hole.

OPEN — seed data, not code: the brief's login `dana.boyd@fieldarena-demo.test`
has **no `auth.users` row**; its two assignments exist but the account cannot
sign in. `announcer@fieldarena-demo.test` can sign in but has **no** staff
assignment, so it renders the empty state. No announcer login works end-to-end
on dev, so every fix above was verified against source + SQL rather than through
the UI.

## 9. Vendor — audited in full (NO fixes applied)

Money math is **correct**. The two highest-severity items go the other way from
usual: FA is *stronger* than legacy on the legal gate, and *stricter* on the
payment flow.

### Money / legal
| # | Finding | Status |
|---|---|---|
| M1 | Legacy gated the booth-agreement signature **client-side only** (`vendor.html:480`); `vendor-checkout-quote`/`-confirm` never checked `agreementSignedAt`, so an API-direct call could pay unsigned. FA blocks it server-side. | OK — FA stronger |
| M2 | Legacy let a vendor pay a **pending** booking immediately (`vendor-checkout-quote` blocked only `confirmed`). | DONE — payment now blocked only for `paid` / `rejected`, and the Pay button shows on any unpaid booking, as legacy did. Approve/reject still exist for the organizer's own workflow |
| M3 | Fee math identical: `price + 8%` per unit, `feeTotal = 8% x price x qty`, flat 8% regardless of GMO | OK |
| M4 | `previewAmountDue` (the Pay button label) didn't round while `priceVendorBooking` did, so the label could differ from the actual charge. Verified: the old preview drifted in 3 of 4 realistic carts (up to ~3c); the new one matches to the cent. | DONE — preview now uses the same round-then-multiply as checkout |
| M5 | Refund cap `refunded <= amount_total - fee_total` matches legacy, and is a DB CHECK constraint rather than a WHERE clause | OK — FA stronger |
| M6 | Vendor never sees `refunded_amount` or `additional_charges_total` — a refunded vendor still sees the full `amount_total`. Legacy had the same blind spot. | OPEN — parity, both wrong |
| M7 | `amount_total`/`fee_total` captured at payment, not recomputed from live catalog | OK |
| M8 | Status vocabulary: legacy `confirmed` -> FA `paid`/`approved` | OK — schema rename |

### Behaviour
| # | Finding | Status |
|---|---|---|
| V1 | `listMyBookings` matched `.or(contact.eq.<email>, name.eq.<profile name>)` — business name is not an identity. RLS blocked any real leak, but a profile name containing a comma broke the PostgREST filter and errored the dashboard | DONE — contact email only, compared in TS so it mirrors RLS's `lower()` exactly |
| V2 | **No rate limiting** on the public unauthenticated apply POST. Legacy capped 5/min per IP+show ([resource].js:117). | DONE — `shared/lib/rate-limit.ts` (fixed window, un-spoofable client IP), applied to `applyToShowPublic` |
| V3 | **Vendor space map never shown to vendors.** Legacy served it as a PUBLIC blob and linked it on the apply page. FA keeps it in a private bucket whose read policy no vendor satisfies — proven live: anon 400, signed-in vendor 400, admin 200. | DONE — short-lived signed URL (1h) resolved server-side, shown on the public apply page and the Reserve Space dialog. Strictly narrower than legacy's permanent public URL |
| V4 | ~~Document `expirationDate`~~ — **withdrawn.** The legacy API accepted it but `uploadVendorDoc` (vendor.html:325) never sent it, so it was always null there too. Parity, not a gap. | NOT A GAP |
| V5 | Checkout mechanism: legacy inline PaymentIntent + Payment Element + Express Checkout (Apple/Google Pay/Link); FA hosted Stripe Checkout redirect | OK — different, equivalent |
| V6 | Tabs 1:1 (bookings / discover / documents / history); documents tab matches legacy's real-mode per-booking requirement checklist exactly | OK |
| V7 | Qty caps count non-rejected bookings; public apply gates on published + not suspended + not demo | OK — both match |
| V8 | Cross-show discover directory — **correction:** legacy DOES have one, `GET /api/shows?discover=vendor` (api/shows.js:14), public and unauthenticated. My first pass read only `discoverView`'s org+email branch and wrongly called FA's a superset. It is parity. | OK — parity |
| V9 | Legacy allowed a booking with an empty cart; FA requires >= 1 item | New in FA — stricter |

**Security migration `20260907120000` IS applied** to this database: table-level
SELECT on `vendor_bookings` is revoked for `authenticated`/`anon`, and
`stripe_customer_id` / `stripe_payment_method_id` are no longer selectable.
`amount_total`, `fee_total`, `stripe_payment_intent_id` remain readable by
design.

Demo login `vendor@fieldarena-demo.test` **works**, but the account has zero
bookings, so it lands on an empty dashboard. Platform-wide there are 3 paid and
4 approved bookings, none pending — every paid one is signed, so the agreement
gate is holding in real data.


## 10. Rider — audited in full (NO fixes applied)

Checkout money math is a **faithful, gate-for-gate port**. The serious finding is
not money — it is the waiver.

### Legal / documents (highest severity)
| # | Finding | Status |
|---|---|---|
| R1 | **[FIXED] Waiver placeholders were never substituted.** Legacy filled `{{SHOW_NAME}}` / `{{SHOW_DATES}}` / `{{ORGANIZER_NAME}}` at `initWaiverStep` (rider.html:1944). FA passes `show.waiver_text` raw to `WaiverForm` (`app/rider/shows/[showId]/page.tsx:97`) and no substitution exists anywhere in the codebase — while the organizer-side card explicitly promises "they're filled in automatically" (`waiver-card.tsx:37`). **Live: 14 of 21 shows with a waiver contain unsubstituted placeholders; 10 of them are published.** A rider signed "...participate in {{SHOW_NAME}} on {{SHOW_DATES}}, produced by {{ORGANIZER_NAME}}..." | DONE — `fill-waiver-placeholders.ts`, applied at the one render site. Verified across all 10 published shows: 40 placeholders before, **0** after. Uses `replaceAll`; legacy's own `.replace()` left 10 behind because `{{ORGANIZER_NAME}}` occurs twice |
| R2 | Legacy fell back to `WAIVER_TEXT_TEMPLATE` when the organizer had written nothing, so a waiver was always presented. FA rendered none. | DONE — falls back to `WAIVER_TEXT_DEFAULT`. The checkout gate still keys off the organizer's OWN text, exactly as legacy's `priceCart` did, so no enforcement legacy lacked was invented |
| R3 | Waiver enforcement itself: **server-side in both**, and FA's is a faithful port — `priceCart` blocks checkout when `waiver_text` is set and no signature row exists. Scroll-to-bottom gate, short-waiver mount fallback, date field, idempotent re-sign all ported. | OK |
| R4 | Horse documents **never gated entry in legacy** — `documentUploads` appears nowhere in `priceCart`. FA matches (no gate). The brief's premise that documents were required before entry does not hold for either version. | OK — parity |
| R5 | Storage scoping for `horse-documents` matches the stated intent exactly: owner via path segment 1, plus staff on a show the horse is actually entered in. | OK |
| R6 | Legacy's `verify-horse-document` PATCH also let an organizer correct a rider-entered **expirationDate** typo. | DONE — both fields now optional and patched only when present, matching legacy's field-by-field PATCH |
| R7 | Legacy scoped verification to "this horse is on **this showId's** roster". FA's mutation takes `showId` but ignores it; RLS (`horse_in_approvable_show`) scopes to "any show you can approve documents for". Same effective set of people — `showId` is decorative. | OK — note |

### Second agent's Rider table — three corrections
- **Cap race at fulfilment**, marked "legacy: Not handled / FA: new safeguard (c)" — **wrong.** Legacy handles it at `finalizeClaimedOrder` (api/rider/[resource].js:772-812), including the identical `correction` string. Parity, not new.
- **Scorecard gating**, marked "results_published surfaced for UI messaging but not an extra barrier" — **wrong**, see R15; proven with a rolled-back transaction.
- **Orders list**, flagged partial — **not a gap.** Legacy fetched every order then filtered with `realOrdersForShow()` (rider.html:2519); every consumer is per-show. FA's per-show query is equivalent.
- That table also **missed R1 entirely** — it checked that the waiver is required and signed, but not what the signed text says.


### Money
| # | Finding | Status |
|---|---|---|
| R8 | Every `priceCart` gate ported in the same order: published, suspended/demo, ticket window, waiver, class-belongs-to-show, horse-belongs-to-rider, class cap, add-on inventory, total > 0 | OK |
| R9 | Fee math identical — class entry `fee + calcPlatformFee(fee, feeModel)` (GMO-aware 18%), qualifications and add-ons `price + flat 8%`, `feeTotal` recomputed from base prices rather than reversed out of the gross | OK |
| R10 | Cap check identical (`schedule_extras.maxRidersPerEvent`, excludes `scratched`); rider numbering identical (base 101, pad 4, distinct-rider count); over-cap race handled with the same `correction` note | OK |
| R11 | Failure path identical — order flipped back to `pending` if fulfilment throws, so a paid order is never stranded | OK |
| R12 | Rider never sees `refunded_amount` / `additional_charges_total`. Legacy's API returned them but rider.html never rendered them either. | OK — parity, both blind |
| R13 | `class_entries.order` → `ride_order` rename: behaviour identical (`max(existing)+1`, empty → 0) | OK — rename only |
| R14 | Stabling is **dates only, no charges**, on a paid order. Same three checks and same messages both sides. | OK |

### Results
| # | Finding | Status |
|---|---|---|
| R15 | Legacy showed a rider their own scoresheet the moment the judge **submitted** it — no publish gate anywhere in `handleScorecard`. FA additionally required `results_published` (proven: same score, 0 rows unpublished / 1 published). | DONE — migration `20260907150000` adds `scores_select_own_submitted` (own entry AND submitted). Additive, so the published policy is untouched. Verified live: owner sees the submitted sheet unpublished, the judge's unsubmitted working copy stays hidden, another rider and anon both see 0 |

### Other
- Same class entered twice on two different horses: supported both sides.
- Legacy auto-defaulted the horse when the rider owned exactly one; FA does not.
- Public show pages (`/show/[showId]`, `/shows`) intact — client-requested addition, not flagged.
- Demo login `rider@yopmail.com` **works** and has 2 real entries.



### Orphaned document blobs (ShowStaff upload) — proposed, NOT built

`uploadShowDocument` uploads the PDF, then inserts the `documents` row. If that
insert fails it tries to remove the blob — and for ShowStaff that removal is
RLS-denied by design: they hold INSERT on `documents` and nothing else
(`documents_insert_showstaff`, 20260806150000), and `fa_documents_write` gates
storage removal behind `canEditShow`, which ShowStaff's empty permission
defaults never satisfy. Legacy drew the same line deliberately
(showstaff-ops.html:919, "removal is organizer-only server-side").

The rollback is therefore explicitly best-effort: the denial is logged and
discarded so it can never mask the insert error the caller actually needs. The
residue is a blob in the `documents` bucket with no row pointing at it —
invisible to every read path (all of which list from the table), but it
accumulates.

**Proposed, not implemented:** a periodic sweep that lists `documents` bucket
objects, left-joins them against `documents.path`, and deletes anything unmatched
and older than a grace period (an hour is more than enough — the only window is
between a successful upload and a failed insert). It has to run with elevated
privilege, which no app code does today, so the natural home is a scheduled
Edge Function or a cron job outside the request path — deliberately NOT a
service-role client in a Server Action, which would cut against
`.claude/rules/architecture.md`. Low urgency: the orphan only appears when an
insert fails after a successful upload, which needs a DB error or a race, and
each one is a single small PDF.


## 4. Client-requested features — must NOT be reverted

All 6 verified intact; core files untouched by any parity work.

| Feature | Status |
|---|---|
| Test Builder (Sections→Items→Instructions, Penalties, Scoring Config) | ✅ Complete |
| Manual class running order (`custom`) | ✅ Complete — note: `use-schedule-preferences-form.ts` doesn't exist; logic is in `schedule-preferences-card.tsx` |
| Class sponsors | ✅ Complete |
| Section-based judge sheets | ✅ Complete |
| Public show pages | ✅ Complete |
| Multi-role workspace switcher | ✅ Complete |

---

## Open decisions needing your call

1. Edit-Organizer blank pre-fill — real bug, small fix
2. Owner provisioning (B9) — needs a Supabase auth-setting confirmation
3. Experience-as-rider (B25) — scope decision
4. Refund over-cap — RESOLVED: restored legacy's silent clamp (`Math.min(amount, maxRefundable)`), erroring only when nothing remains. Verified: $600 against a $460 cap now refunds $460 instead of failing.
