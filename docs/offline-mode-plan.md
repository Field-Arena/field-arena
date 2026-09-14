# Offline mode — engineering plan

Scope agreed with the client: **judge and scribe scoring only** — see
`Field-Arena-Offline-Mode-Proposal.pdf`. Everything else (payments, live
results, multi-judge panels, organizer tools) stays connected on purpose; see
that document for why.

## Phase 1 — Confirm the scope ✅

Done. Judge + scribe scoring is the target, not the whole app.

## Phase 2 — Make it installable

- `src/app/manifest.ts` — web app manifest, `start_url: /dashboard/judging`,
  standalone display, brand icons at `public/icons/`.
- `public/sw.js` — a deliberately small service worker, scoped only to
  `/dashboard/scoring`, `/dashboard/judging`, `/api/scoring/*`, and
  `/_next/static/*`. Network-first, falls back to the last cached response.
  Registered from `scoring-screen.tsx` on mount (not app-wide).
- **What this buys:** a judge/scribe can "Add to Home Screen" and reopen the
  scoring screen from cache if the tab is reloaded (or the OS kills it and
  relaunches) while offline, as long as it was opened at least once with
  signal first.
- **What this does not buy:** a true cold start with _zero_ prior signal
  ever. That's out of scope — the realistic failure mode is "signal drops
  mid-class," not "judge's device has never once been online."

## Phase 3 — Offline scoring + auto-sync

The core promise: a mark a judge/scribe enters is never lost, connection or
not.

**`src/modules/scoring/offline/`** (new — sits outside the usual
`constants → types → schemas → data → hooks → ui` layering on purpose:
IndexedDB is browser storage, not a Supabase concern, so it doesn't belong in
`data/`):

- `db.ts` — thin IndexedDB wrapper (`fa-scoring-offline` DB, one
  `pending_writes` store, no third-party dependency).
- `registry.ts` — the specific server actions that are safe to replay
  unattended after a reconnect: `setMark`, `setCollective`, `setRemark`,
  `setFinalRemarks`, `toggleErrorAt`. (Not scratches, disqualifications,
  submit/publish, panel changes, etc. — those stay on the plain in-memory
  queue and surface an error immediately instead of silently queuing, since
  getting one of those wrong is a bigger deal than a missed mark.)
- `queue.ts` — `enqueueDurableWrite(action, payload)`: persists the write to
  IndexedDB _before_ attempting it, tries a few quick retries (reusing the
  existing `WRITE_RETRY_MS` / `MAX_WRITE_RETRIES` constants), and only
  deletes the local copy once the server confirms it. If all quick retries
  fail, the write stays on the device for the background sync to pick up
  later — closing the tab or losing power at that point does not lose it.
- `sync-manager.ts` — `startOfflineSync()`: on mount, on the browser's
  `online` event, and on a 15s fallback interval (the `online` event alone
  isn't fully reliable), replays whatever is still in IndexedDB, in the
  order it was written.
- `use-offline-sync.ts` — the hook the scoring screen mounts; reports
  `{ online, pendingCount }`.

**Wired in:**

- `hooks/use-scoring-mutations.ts` — `useSetMark`, `useSetCollective`,
  `useSetRemark`, `useSetFinalRemarks`, `useToggleErrorAt` now go through
  `enqueueDurableWrite` instead of the old in-memory-only queue.
  react-query's own retry is turned off for these — the durable queue owns
  retry/backoff now, so it isn't duplicated.
- `ui/scoring-screen.tsx` — mounts `useOfflineSync`, registers the service
  worker, renders `OfflineStatusBanner` (amber "offline, saving on this
  device" / blue "back online, syncing N marks").

## Deliberately not yet done

- **Judge/scribe conflict flag.** The proposal calls for: if a judge's and
  scribe's marks for the same rider don't line up after both reconnect, a
  staff member should see a clear flag to pick the right one instead of one
  silently overwriting the other. The current `merge_score_json` RPC does
  field-level last-write-wins, which is fine for two different seats writing
  to their own separate score rows — it isn't yet building the
  discrepancy-detection view/table this needs. That's real, separate work
  (a migration + a staff-facing review screen) and is the next slice.
- **Full offline read for a class never opened online.** Covered under
  Phase 2's limits above.
- **Anything outside scoring** — entries, payments, results publishing to
  spectators, organizer tools. Out of scope per the proposal.

## How to verify manually

1. Open a class's scoring screen as a judge (`/dashboard/scoring/[classId]`)
   while online — this warms the service worker cache and IndexedDB.
2. Turn off WiFi/data. Enter a few marks — the amber "Offline" banner shows,
   the test sheet keeps responding normally.
3. Reload the tab while still offline — the screen reopens from the service
   worker cache instead of failing to load.
4. Turn the connection back on. Within ~15s (usually instantly, via the
   `online` event) the banner switches to "syncing," then disappears once
   the queued marks have posted.
