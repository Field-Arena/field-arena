import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { getStripeClient, isStripeConfigured } from '@/shared/lib/stripe';
import { isStaleAccountError } from '@/shared/lib/stripe-errors';

/**
 * Organizer-workspace reads.
 *
 * Replaces the hardcoded figures in modules/staff/constants.ts. Everything here
 * is derived from rows, and where a number cannot be derived yet it is reported
 * as what it actually is rather than filled in with a plausible-looking value.
 *
 * Queries go through the caller's client so RLS scopes them. An Organizer sees
 * only their own organization's shows because can_access_org() says so, not
 * because of a WHERE clause that could be forgotten.
 */

export interface ShowListItem {
  id: string;
  name: string;
  dateLabel: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string | null;
  published: boolean;
  venueName: string | null;
}

export interface ShowStats {
  riders: number;
  entries: number;
  horses: number;
  vendorSpaces: number;
  /** Classes configured on the show — each one a distinct test riders can enter. */
  testsOffered: number;
  /** Sum of paid orders. Genuinely zero until rider checkout is migrated. */
  settledRevenue: number;
  /**
   * What the roster is worth at current class prices — sum of each entry's class
   * fee. Distinct from settled revenue: nobody has paid it. The legacy dashboard
   * conflated the two under one "Revenue (all-in)" figure.
   */
  entryValue: number;
}

export interface InventoryRow {
  name: string;
  qty: number;
  revenue: number;
  /** False when the figure is owed rather than collected. */
  settled: boolean;
}

/** Every show the caller's organization owns, newest first. */
export async function listShowsForOrg(orgId: string): Promise<ShowListItem[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('shows')
    .select('id, name, date_label, start_date, end_date, status, published, venue_name, venue_id')
    .eq('org_id', orgId)
    .order('start_date', { ascending: false });
  if (error) throw error;

  // venue_name is the show-builder's free-text label; venue_id points at a real
  // reusable venue row. Either may be set, so both are resolved and the free-text
  // one wins when present — that is what the organizer typed for this show.
  const venueIds = data.map((s) => s.venue_id).filter((id): id is string => id !== null);

  const venueNames = new Map<string, string>();
  if (venueIds.length > 0) {
    const { data: venues, error: venueError } = await supabase
      .from('venues')
      .select('id, name')
      .in('id', venueIds);
    if (venueError) throw venueError;
    for (const venue of venues) venueNames.set(venue.id, venue.name);
  }

  return data.map((show) => ({
    id: show.id,
    name: show.name,
    dateLabel: show.date_label,
    startDate: show.start_date,
    endDate: show.end_date,
    status: show.status,
    published: show.published ?? false,
    venueName: show.venue_name ?? (show.venue_id ? (venueNames.get(show.venue_id) ?? null) : null),
  }));
}

/**
 * Headline counts for one show.
 *
 * Riders and horses are counted from the entry roster's text fields rather than
 * the rider_id/horse_id foreign keys. Those FKs are only populated when a real
 * rider account created the entry; an organizer-imported roster has none, and
 * counting the FKs would report zero riders for a show with a full start list.
 */
export async function getShowStats(showId: string): Promise<ShowStats> {
  const supabase = await createServerClient();

  const { data: classes, error: classError } = await supabase
    .from('classes')
    .select('id, fee')
    .eq('show_id', showId);
  if (classError) throw classError;

  const classIds = classes.map((c) => c.id);
  const feeByClass = new Map(classes.map((c) => [c.id, c.fee ?? 0]));

  let entries: { rider: string | null; horse: string | null; class_id: string }[] = [];
  if (classIds.length > 0) {
    const { data, error } = await supabase
      .from('class_entries')
      .select('rider, horse, class_id')
      .in('class_id', classIds);
    if (error) throw error;
    entries = data;
  }

  const [{ count: vendorCount }, { data: paidOrders, error: orderError }] = await Promise.all([
    supabase
      .from('vendor_bookings')
      .select('id', { count: 'exact', head: true })
      .eq('show_id', showId)
      .eq('status', 'paid'),
    supabase.from('orders').select('amount_total').eq('show_id', showId).eq('status', 'paid'),
  ]);
  if (orderError) throw orderError;

  const riders = new Set(entries.map((e) => e.rider).filter(Boolean));
  const horses = new Set(entries.map((e) => e.horse).filter(Boolean));

  return {
    riders: riders.size,
    entries: entries.length,
    horses: horses.size,
    vendorSpaces: vendorCount ?? 0,
    testsOffered: classes.length,
    settledRevenue: paidOrders.reduce((sum, o) => sum + o.amount_total, 0),
    entryValue: entries.reduce((sum, e) => sum + (feeByClass.get(e.class_id) ?? 0), 0),
  };
}

/**
 * The purchases-and-inventory breakdown.
 *
 * Each row carries whether its figure is settled money or an amount owed, so the
 * UI can label them differently instead of presenting both as revenue.
 */
export async function getShowInventory(showId: string): Promise<InventoryRow[]> {
  const supabase = await createServerClient();
  const stats = await getShowStats(showId);

  const [{ data: addOns, error: addOnError }, { data: bookings, error: bookingError }] =
    await Promise.all([
      supabase.from('add_ons').select('id, name, price, enabled').eq('show_id', showId),
      supabase.from('vendor_bookings').select('id, amount_total, status').eq('show_id', showId),
    ]);
  if (addOnError) throw addOnError;
  if (bookingError) throw bookingError;

  const paidBookings = bookings.filter((b) => b.status === 'paid');

  return [
    {
      name: 'Class entries',
      qty: stats.entries,
      revenue: stats.entryValue,
      settled: false,
    },
    {
      name: 'Add-ons offered',
      qty: addOns.filter((a) => a.enabled !== false).length,
      // Nothing has been bought: add-on purchases arrive as order line items, and
      // rider checkout is not migrated.
      revenue: 0,
      settled: true,
    },
    {
      name: 'Vendor bookings',
      qty: paidBookings.length,
      revenue: paidBookings.reduce((sum, b) => sum + (b.amount_total ?? 0), 0),
      settled: true,
    },
  ];
}

/**
 * Where the show sits in its lifecycle.
 *
 * Derived from real columns rather than a stored stage: `published` gates ticket
 * sales, `runner_state` carries schedule approval and sales-close (both of which
 * were browser-local flags in the legacy build, invisible to any other device),
 * and results_published on classes marks completion.
 */
export async function getShowStage(showId: string): Promise<string> {
  const supabase = await createServerClient();

  const { data: show, error } = await supabase
    .from('shows')
    .select('published, runner_state')
    .eq('id', showId)
    .single();
  if (error) throw error;

  const { count: publishedClasses } = await supabase
    .from('classes')
    .select('id', { count: 'exact', head: true })
    .eq('show_id', showId)
    .eq('results_published', true);

  if ((publishedClasses ?? 0) > 0) return 'complete';

  const runner = (show.runner_state ?? {}) as { approved?: boolean; ticketClosed?: boolean };
  if (runner.approved) return 'live';
  if (runner.ticketClosed) return 'sales-closed';
  if (show.published) return 'sales-open';
  return 'setup';
}

export interface ShowManagerVitals {
  stats: ShowStats;
  stage: string;
}

/**
 * The lifecycle-bar-plus-stat-cards header the Admin Console design repeats
 * above every Show Manager tab (Setup, Rider Entries, and the rest) — not
 * only the Dashboard. Deliberately excludes the ring/clock strip: the
 * legacy showstaff.html shows that only on Dashboard, ShowRunner, and Users
 * ("the operational screens... where a live ring status makes sense"), and
 * even there it falls back to illustrative numbers until a real live-scoring
 * session has been seeded — no such data exists yet, so it stays off Show
 * Manager's setup/admin tabs entirely rather than showing something fake.
 */
export async function getShowManagerVitals(showId: string): Promise<ShowManagerVitals> {
  const [stats, stage] = await Promise.all([getShowStats(showId), getShowStage(showId)]);
  return { stats, stage };
}

export interface RunShowData {
  showId: string;
  showName: string;
  stage: string;
  published: boolean;
  waiverApproved: boolean;
  runner: { ticketClosed: boolean; approved: boolean };
  stats: ShowStats;
  classResults: { total: number; resultsPublished: number; scoringOpen: number };
}

/**
 * Run Show tab: the show's live-day status plus real class-results progress.
 * Live scoring and an announcer view have no backing implementation yet
 * (judging/scoring/announcements modules are data-layer only so far) — this
 * intentionally stops at what's real: stats, stage, and the stage-advance
 * actions the lifecycle already supports via runner_state.
 */
export async function getRunShowData(showId: string): Promise<RunShowData | null> {
  const supabase = await createServerClient();

  const showResult = await supabase
    .from('shows')
    .select('id, name, published, runner_state, waiver_text, waiver_approved_text')
    .eq('id', showId)
    .maybeSingle();
  if (showResult.error) throw showResult.error;
  if (!showResult.data) return null;
  const show = showResult.data;

  const [stage, stats, classes] = await Promise.all([
    getShowStage(showId),
    getShowStats(showId),
    supabase.from('classes').select('id, scoring_open, results_published').eq('show_id', showId),
  ]);
  if (classes.error) throw classes.error;

  const runner = (show.runner_state ?? {}) as { approved?: boolean; ticketClosed?: boolean };

  return {
    showId: show.id,
    showName: show.name,
    stage,
    published: show.published ?? false,
    waiverApproved: !!show.waiver_approved_text && show.waiver_approved_text === show.waiver_text,
    runner: { ticketClosed: !!runner.ticketClosed, approved: !!runner.approved },
    stats,
    classResults: {
      total: classes.data.length,
      resultsPublished: classes.data.filter((c) => c.results_published).length,
      scoringOpen: classes.data.filter((c) => c.scoring_open).length,
    },
  };
}

export interface IncompleteShowSummary {
  id: string;
  name: string;
  dateLabel: string | null;
  startDate: string | null;
  venueName: string | null;
}

/**
 * Shows still in Setup — unpublished, so by construction none of the later
 * getShowStage() branches (complete/live/sales-closed/sales-open) apply.
 * Matches the legacy `status === 'red'` → 'setup' rule from showstaff.html,
 * but reads it off `published` directly rather than the `status`
 * green/yellow/red column: nothing in this codebase's stage logic
 * (getShowStage above) uses that column, and duplicating the same fact in
 * two places is how they drift.
 */
export async function listIncompleteShowsForOrg(orgId: string): Promise<IncompleteShowSummary[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('shows')
    .select('id, name, date_label, start_date, venue_name')
    .eq('org_id', orgId)
    .eq('published', false)
    .order('start_date', { ascending: true, nullsFirst: false });
  if (error) throw error;

  return data.map((s) => ({
    id: s.id,
    name: s.name,
    dateLabel: s.date_label,
    startDate: s.start_date,
    venueName: s.venue_name,
  }));
}

export interface ShowPickerSummary extends IncompleteShowSummary {
  published: boolean;
  /** setup | sales-open | sales-closed | live | complete — see getShowStage. */
  stage: string;
}

/**
 * Every show for the org, for Show Manager's "Pick a show" list.
 *
 * Distinct from listIncompleteShowsForOrg, which filters to published = false
 * because that screen is only about what still needs finishing. This one keeps
 * published shows so a live show can be picked and shown as such — an organizer
 * running a show today opens Show Manager to reach it, not to fix it.
 *
 * `stage` is computed inline rather than by calling getShowStage per row (which
 * would be an N+1 — one classes count query per show): the same
 * published/runner_state/results_published logic, but the results_published
 * check is one batched query across every show in the org instead of one per
 * show. Keeping this list's own "Live" pill accurate matters — `published`
 * alone turns true the moment ticket sales open, several stages before the
 * show is actually live, and this list used to show "Live" for all of them.
 */
export async function listShowsForPicker(orgId: string): Promise<ShowPickerSummary[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('shows')
    .select('id, name, date_label, start_date, venue_name, published, runner_state')
    .eq('org_id', orgId)
    .order('start_date', { ascending: true, nullsFirst: false });
  if (error) throw error;

  const showIds = data.map((s) => s.id);
  const completeShowIds = new Set<string>();
  if (showIds.length > 0) {
    const { data: publishedClasses, error: classError } = await supabase
      .from('classes')
      .select('show_id')
      .in('show_id', showIds)
      .eq('results_published', true);
    if (classError) throw classError;
    for (const row of publishedClasses) completeShowIds.add(row.show_id);
  }

  return data.map((s) => {
    const runner = (s.runner_state ?? {}) as { approved?: boolean; ticketClosed?: boolean };
    const stage = completeShowIds.has(s.id)
      ? 'complete'
      : runner.approved
        ? 'live'
        : runner.ticketClosed
          ? 'sales-closed'
          : s.published
            ? 'sales-open'
            : 'setup';

    return {
      id: s.id,
      name: s.name,
      dateLabel: s.date_label,
      startDate: s.start_date,
      venueName: s.venue_name,
      published: s.published ?? false,
      stage,
    };
  });
}

/**
 * The organization's Stripe Connect account id, or null when it has not
 * onboarded. Read here rather than passed through OrganizerContext because only
 * the Financial tab has any use for it.
 */
export async function getOrgStripeAccountId(orgId: string): Promise<string | null> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('organizations')
    .select('stripe_connect_account_id')
    .eq('id', orgId)
    .maybeSingle();
  if (error) throw error;

  return data?.stripe_connect_account_id ?? null;
}

export interface StripeConnectStatus {
  configured: boolean;
  connected: boolean;
  accountId: string | null;
  /** 'not_started' until an account exists, then Stripe's own verdict. */
  status: 'not_started' | 'onboarding' | 'restricted' | 'active' | 'error';
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  /** What Stripe is still waiting on, shown verbatim so it can be acted on. */
  requirementsDue: string[];
}

/**
 * The live Connect state, ported from GET /api/organizations/:id/connect.
 *
 * Read from Stripe on every render rather than cached in our own column,
 * because the organization's standing changes on Stripe's side — a verification
 * clearing, or a document expiring — with nothing to tell us about it. The only
 * thing we store is the account id.
 *
 * A Stripe outage degrades to 'error' instead of throwing: the Financial tab is
 * mostly revenue and expenses, and none of that should disappear because a
 * status pill could not be drawn.
 */
export async function getStripeConnectStatus(orgId: string): Promise<StripeConnectStatus> {
  const base = {
    configured: isStripeConfigured(),
    connected: false,
    accountId: null,
    chargesEnabled: false,
    payoutsEnabled: false,
    requirementsDue: [],
  };

  const accountId = await getOrgStripeAccountId(orgId);
  if (!base.configured || !accountId) {
    return { ...base, accountId, status: 'not_started' };
  }

  try {
    const account = await getStripeClient().accounts.retrieve(accountId);
    const { charges_enabled: chargesEnabled, payouts_enabled: payoutsEnabled } = account;

    return {
      ...base,
      connected: true,
      accountId,
      // Legacy's own ladder: fully enabled is active; a disabled_reason means
      // Stripe has stopped the account and wants something; anything else is
      // still working through onboarding.
      status: chargesEnabled && payoutsEnabled
        ? 'active'
        : account.requirements?.disabled_reason
          ? 'restricted'
          : 'onboarding',
      chargesEnabled,
      payoutsEnabled,
      requirementsDue: account.requirements?.currently_due ?? [],
    };
  } catch (error) {
    /**
     * An account these keys cannot see is not an outage — it is an account
     * belonging to a different Stripe platform, left behind by a key swap.
     * Reporting it as "not started" is both true and actionable: the connect
     * button then offers to create one, and startStripeConnect replaces the
     * stale id. Calling it an error would leave the organizer looking at a
     * dead account id with nothing to do about it.
     */
    if (isStaleAccountError(error)) {
      return { ...base, accountId: null, status: 'not_started' };
    }
    return { ...base, connected: true, accountId, status: 'error' };
  }
}

export interface OrgChargeRow {
  id: string;
  /** The show the money was collected for. */
  show: string;
  date: string;
  amount: number;
  /** The platform fee taken out of it. */
  fee: number;
}

export interface OrgPayoutRow {
  id: string;
  date: string | null;
  status: string;
  amount: number;
}

export interface OrgBilling {
  /** Every paid order across the organization, newest first. */
  charges: OrgChargeRow[];
  /**
   * Transfers that have actually reached the organizer's bank, newest first.
   *
   * Empty until Stripe Connect is onboarded — the legacy endpoint returns an
   * empty list rather than an error for an org with no connected account, and
   * the panel reads that as "No payouts yet."
   */
  payouts: OrgPayoutRow[];
}

/**
 * The Charges / Payouts / Deposits detail behind the Financial tab's three
 * cards, ported from GET /api/organizations/:id/org-billing.
 *
 * Charges and Deposits are the same paid orders framed two ways — what riders
 * and vendors paid in, and what has landed in Field & Arena's account before a
 * payout goes out — exactly as the legacy endpoint served them.
 */
export async function getOrgBilling(orgId: string): Promise<OrgBilling> {
  const supabase = await createServerClient();

  const payouts = await listStripePayouts(orgId);

  const { data: shows, error: showsError } = await supabase
    .from('shows')
    .select('id, name')
    .eq('org_id', orgId);
  if (showsError) throw showsError;

  if (shows.length === 0) return { charges: [], payouts };

  const showNames = new Map(shows.map((s) => [s.id, s.name]));

  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, show_id, paid_at, created_at, amount_total, fee_total')
    .in(
      'show_id',
      shows.map((s) => s.id)
    )
    .eq('status', 'paid');
  if (ordersError) throw ordersError;

  const charges = orders
    .map((o) => ({
      id: o.id,
      show: showNames.get(o.show_id) ?? '—',
      // paid_at is null on an order marked paid without a Stripe webhook;
      // created_at is the only date left to sort and show it by.
      date: o.paid_at ?? o.created_at,
      amount: o.amount_total,
      fee: o.fee_total ?? 0,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  return { charges, payouts };
}

/**
 * The connected account's own payouts — money that has left Stripe for the
 * organizer's bank, ported from the legacy endpoint's `payouts` branch.
 *
 * Listed against the connected account, not the platform's: a platform-level
 * list would be Field & Arena's own bank transfers, which is a different
 * organization's money and never what this card means.
 *
 * An org with no account, or a Stripe error, yields an empty list rather than
 * failing the page — same as the legacy, which returned `{ rows: [] }` for
 * both.
 */
async function listStripePayouts(orgId: string): Promise<OrgPayoutRow[]> {
  if (!isStripeConfigured()) return [];

  const accountId = await getOrgStripeAccountId(orgId);
  if (!accountId) return [];

  try {
    const list = await getStripeClient().payouts.list(
      { limit: 50 },
      { stripeAccount: accountId }
    );

    return list.data.map((p) => ({
      id: p.id,
      // Stripe deals in the smallest currency unit and in epoch seconds.
      amount: p.amount / 100,
      status: p.status,
      date: p.arrival_date ? new Date(p.arrival_date * 1000).toISOString() : null,
    }));
  } catch {
    return [];
  }
}

/* ── Needs your attention ────────────────────────────────────────────────
   Ported from showstaff.html's attentionItems(). Every item is computed from
   data that is already real — nothing is invented just to have something to
   show, which is what the legacy comment insists on and what makes the panel
   worth reading at all. */

export interface AttentionItem {
  /** 'warn' blocks the show going live; 'info' wants a decision, not a fix. */
  severity: 'warn' | 'info';
  label: string;
  detail: string;
  actionLabel: string;
  href: string;
}

/**
 * Reads `shows.ticket_close`, which is stored as `YYYY-MM-DD · HH:MM`.
 *
 * Not an ISO timestamp and not parseable by `new Date()` directly — the legacy
 * wrote this shape from two different screens and the column kept it. Anything
 * that does not match is treated as unset rather than guessed at, because a
 * misparsed close date would either hide a real deadline or invent one.
 */
function ticketCloseAt(value: string | null): number | null {
  if (!value) return null;
  const match = /^(\d{4}-\d{2}-\d{2})\s*·\s*(\d{2}:\d{2})$/.exec(value.trim());
  if (!match) return null;
  const time = new Date(`${match[1] ?? ''}T${match[2] ?? ''}:00`).getTime();
  return Number.isNaN(time) ? null : time;
}

/**
 * Everything about this show that wants the organizer's attention right now.
 *
 * Sits above the stat cards because "is anything broken" is the first question
 * on landing, and a grid of equally-weighted tiles answers it last. Warnings
 * come before information: a show that cannot go live outranks a vendor
 * application waiting on a decision.
 */
export async function getShowAttention(showId: string): Promise<AttentionItem[]> {
  const supabase = await createServerClient();

  const { data: show, error } = await supabase
    .from('shows')
    .select('id, name, published, ticket_close, runner_state, waiver_text, waiver_approved_text')
    .eq('id', showId)
    .maybeSingle();
  if (error) throw error;
  if (!show) return [];

  const setupHref = `/dashboard/shows/${showId}`;
  const items: AttentionItem[] = [];

  // ── Lifecycle deadlines ──
  //
  // Gated on `published` alone. The legacy also excluded shows whose status was
  // 'blue', its colour code for finished — our `status` column does not carry
  // that vocabulary, so porting the comparison would have been a condition that
  // silently never matched. An unpublished show needs publishing regardless.
  if (!show.published) {
    items.push({
      severity: 'warn',
      label: "Show isn't published yet",
      detail: `Riders can't see or enter ${show.name} until it's published.`,
      actionLabel: 'Go to Setup',
      href: setupHref,
    });
  }

  const closeAt = ticketCloseAt(show.ticket_close);
  if (closeAt !== null) {
    const days = Math.ceil((closeAt - Date.now()) / 86_400_000);
    // Only the last week. A deadline three months out is not attention-worthy,
    // and one already past is a different problem than an approaching one.
    if (days >= 0 && days <= 7) {
      items.push({
        severity: 'warn',
        label: `Ticket sales close in ${days === 0 ? 'less than a day' : `${String(days)} day${days === 1 ? '' : 's'}`}`,
        detail: `Sales close ${show.ticket_close ?? ''}.`,
        actionLabel: 'Review',
        href: setupHref,
      });
    }
  }

  // ── Schedule ──
  const runner = (show.runner_state ?? {}) as { approved?: boolean };
  if (runner.approved !== true) {
    items.push({
      severity: 'warn',
      label: "Schedule hasn't been approved",
      detail: 'The built schedule is still pending your review.',
      actionLabel: 'Review schedule',
      href: `/dashboard/shows/${showId}/schedule`,
    });
  }

  /**
   * Go-live readiness, the same two checks Run Show itself makes.
   *
   * Surfaced here rather than only at the moment someone clicks Run Show,
   * where it arrives as a surprise refusal.
   */
  const { count: classCount } = await supabase
    .from('classes')
    .select('id', { count: 'exact', head: true })
    .eq('show_id', showId);

  let entryCount = 0;
  if ((classCount ?? 0) > 0) {
    const { data: classes } = await supabase.from('classes').select('id').eq('show_id', showId);
    const ids = (classes ?? []).map((c) => c.id);
    if (ids.length > 0) {
      const { count } = await supabase
        .from('class_entries')
        .select('id', { count: 'exact', head: true })
        .in('class_id', ids);
      entryCount = count ?? 0;
    }
  }

  if (entryCount === 0) {
    items.push({
      severity: 'warn',
      label: 'Not ready to go live',
      detail: 'No classes have any real entries yet.',
      actionLabel: 'Fix it',
      href: `/dashboard/shows/${showId}/select-events`,
    });
  } else if (!show.waiver_approved_text || show.waiver_approved_text !== show.waiver_text) {
    // Approved, and not silently edited since — riders are about to sign
    // whatever is in that box, so an unreviewed draft is not good enough.
    items.push({
      severity: 'warn',
      label: 'Not ready to go live',
      detail:
        'The waiver of liability hasn\'t been approved yet — go to Setup and click "Approve this waiver".',
      actionLabel: 'Fix it',
      href: setupHref,
    });
  }

  // ── Waiting on a decision ──
  const [{ count: pendingVendors }, { count: pendingStaff }] = await Promise.all([
    supabase
      .from('vendor_bookings')
      .select('id', { count: 'exact', head: true })
      .eq('show_id', showId)
      .eq('status', 'pending'),
    supabase
      .from('staff_assignments')
      .select('id', { count: 'exact', head: true })
      .eq('show_id', showId)
      .eq('status', 'pending'),
  ]);

  if ((pendingVendors ?? 0) > 0) {
    const n = pendingVendors ?? 0;
    items.push({
      severity: 'info',
      label: `${String(n)} vendor application${n === 1 ? '' : 's'} waiting on you`,
      detail: 'New bookings need review before they\'re confirmed.',
      actionLabel: 'Review vendors',
      href: '/dashboard/vendor',
    });
  }

  if ((pendingStaff ?? 0) > 0) {
    const n = pendingStaff ?? 0;
    items.push({
      severity: 'info',
      label: `${String(n)} staff invite${n === 1 ? '' : 's'} not yet accepted`,
      detail: "They won't have access until they accept.",
      actionLabel: 'Review staff',
      href: '/dashboard/users',
    });
  }

  return items;
}
