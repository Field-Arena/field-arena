import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';

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
}

/**
 * Every show for the org, for Show Manager's "Pick a show" list.
 *
 * Distinct from listIncompleteShowsForOrg, which filters to published = false
 * because that screen is only about what still needs finishing. This one keeps
 * published shows so a live show can be picked and shown as such — an organizer
 * running a show today opens Show Manager to reach it, not to fix it.
 */
export async function listShowsForPicker(orgId: string): Promise<ShowPickerSummary[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('shows')
    .select('id, name, date_label, start_date, venue_name, published')
    .eq('org_id', orgId)
    .order('start_date', { ascending: true, nullsFirst: false });
  if (error) throw error;

  return data.map((s) => ({
    id: s.id,
    name: s.name,
    dateLabel: s.date_label,
    startDate: s.start_date,
    venueName: s.venue_name,
    published: s.published ?? false,
  }));
}
