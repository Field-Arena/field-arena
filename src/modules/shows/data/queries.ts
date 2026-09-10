import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { getStripeClient, isStripeConfigured } from '@/shared/lib/stripe';
import { isStaleAccountError } from '@/shared/lib/stripe-errors';

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

  testsOffered: number;

  settledRevenue: number;

  entryValue: number;
}

export interface InventoryRow {
  name: string;
  qty: number;
  revenue: number;

  settled: boolean;
}

export async function listShowsForOrg(orgId: string): Promise<ShowListItem[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('shows')
    .select('id, name, date_label, start_date, end_date, status, published, venue_name, venue_id')
    .eq('org_id', orgId)
    .order('start_date', { ascending: false });
  if (error) throw error;

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

export async function getShowManagerVitals(showId: string): Promise<ShowManagerVitals> {
  const [stats, stage] = await Promise.all([getShowStats(showId), getShowStage(showId)]);
  return { stats, stage };
}

export interface RunShowData {
  showId: string;
  showName: string;
  stage: string;
  published: boolean;
  publishedAt: string | null;
  waiverApproved: boolean;
  runner: { ticketClosed: boolean; approved: boolean };
  stats: ShowStats;
  classResults: { total: number; resultsPublished: number; scoringOpen: number };
}

export async function getRunShowData(showId: string): Promise<RunShowData | null> {
  const supabase = await createServerClient();

  const showResult = await supabase
    .from('shows')
    .select('id, name, published, published_at, runner_state, waiver_text, waiver_approved_text')
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
    publishedAt: show.published_at,
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

  stage: string;
}

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

export async function getOrgStripeAccountId(orgId: string): Promise<string | null> {
  // stripe_connect_account_id is deliberately not SELECT-able by the
  // `authenticated` role (see 20260907120000_fix_money_column_privileges.sql):
  // any staff member on a show could otherwise read its organization's Stripe
  // identifier. Callers here already scope orgId to the current organizer, so
  // this reads it server-side with the service role.
  const admin = createAdminClient();

  const { data, error } = await admin
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

  status: 'not_started' | 'onboarding' | 'restricted' | 'active' | 'error';
  chargesEnabled: boolean;
  payoutsEnabled: boolean;

  requirementsDue: string[];
}

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

      status:
        chargesEnabled && payoutsEnabled
          ? 'active'
          : account.requirements?.disabled_reason
            ? 'restricted'
            : 'onboarding',
      chargesEnabled,
      payoutsEnabled,
      requirementsDue: account.requirements?.currently_due ?? [],
    };
  } catch (error) {
    if (isStaleAccountError(error)) {
      return { ...base, accountId: null, status: 'not_started' };
    }
    return { ...base, connected: true, accountId, status: 'error' };
  }
}

export interface OrgChargeRow {
  id: string;

  show: string;
  date: string;
  amount: number;

  fee: number;
}

export interface OrgPayoutRow {
  id: string;
  date: string | null;
  status: string;
  amount: number;
}

export interface OrgBilling {
  charges: OrgChargeRow[];

  payouts: OrgPayoutRow[];
}

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
      shows.map((s) => s.id),
    )
    .eq('status', 'paid');
  if (ordersError) throw ordersError;

  const charges = orders
    .map((o) => ({
      id: o.id,
      show: showNames.get(o.show_id) ?? '—',

      date: o.paid_at ?? o.created_at,
      amount: o.amount_total,
      fee: o.fee_total ?? 0,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  return { charges, payouts };
}

async function listStripePayouts(orgId: string): Promise<OrgPayoutRow[]> {
  if (!isStripeConfigured()) return [];

  const accountId = await getOrgStripeAccountId(orgId);
  if (!accountId) return [];

  try {
    const list = await getStripeClient().payouts.list({ limit: 50 }, { stripeAccount: accountId });

    return list.data.map((p) => ({
      id: p.id,

      amount: p.amount / 100,
      status: p.status,
      date: p.arrival_date ? new Date(p.arrival_date * 1000).toISOString() : null,
    }));
  } catch {
    return [];
  }
}

export interface AttentionItem {
  severity: 'warn' | 'info';
  label: string;
  detail: string;
  actionLabel: string;
  href: string;
}

function ticketCloseAt(value: string | null): number | null {
  if (!value) return null;
  const match = /^(\d{4}-\d{2}-\d{2})\s*·\s*(\d{2}:\d{2})$/.exec(value.trim());
  if (!match) return null;
  const time = new Date(`${match[1] ?? ''}T${match[2] ?? ''}:00`).getTime();
  return Number.isNaN(time) ? null : time;
}

export interface ShowResultRow {
  classId: string;
  className: string;
  division: string | null;
  entryId: string;
  num: string;
  rider: string;
  horse: string;
  testName: string | null;
  pct: number | null;
  rank: number | null;
}

function extractResultTestName(override: unknown): string | null {
  if (!override || typeof override !== 'object') return null;
  const name = (override as Record<string, unknown>).name;
  return typeof name === 'string' && name.trim() ? name : null;
}

function parseResultPct(raw: string | null): number | null {
  if (raw === null || raw === 'SCR' || raw === 'ELIM') return null;
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
}

/* Same "rank within test, not within the whole class" rule as
 * judging/utils/rank-placings.ts — a Test of Choice class puts riders on
 * different tests, so a percentage only means something compared against
 * others on the same test. Duplicated in miniature here rather than
 * importing across modules, since data/ in one module must not depend on
 * another module's internals. */
function rankByTest(
  rows: { entryId: string; testName: string | null; pct: number | null; ctot: number | null }[],
): Map<string, number> {
  const groups = new Map<string, typeof rows>();
  for (const row of rows) {
    if (row.pct === null) continue;
    const key = row.testName ?? '';
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }
  const ranks = new Map<string, number>();
  for (const group of groups.values()) {
    const sorted = [...group].sort((a, b) => {
      if ((b.pct ?? 0) !== (a.pct ?? 0)) return (b.pct ?? 0) - (a.pct ?? 0);
      if (a.ctot != null && b.ctot != null && a.ctot !== b.ctot) return b.ctot - a.ctot;
      return 0;
    });
    let rank = 1;
    sorted.forEach((row, i) => {
      const prev = i > 0 ? sorted[i - 1] : null;
      if (prev) {
        const stillTied =
          row.pct === prev.pct && (row.ctot == null || prev.ctot == null || row.ctot === prev.ctot);
        if (!stillTied) rank = i + 1;
      }
      ranks.set(row.entryId, rank);
    });
  }
  return ranks;
}

/* Every class's confirmed scores for the whole show, ranked per test within
 * each class — this is the source for the organizer-facing CSV export
 * (Show Manager → Results). Unscored entries (no final_pct yet) are still
 * listed with pct/rank null, so the export doubles as a full-roster sheet,
 * not just a winners list. */
export async function getShowResults(showId: string): Promise<ShowResultRow[]> {
  const supabase = await createServerClient();

  const { data: classes, error: classError } = await supabase
    .from('classes')
    .select('id, label, division')
    .eq('show_id', showId)
    .order('label');
  if (classError) throw classError;
  if (classes.length === 0) return [];

  const classIds = classes.map((c) => c.id);
  const { data: entries, error: entryError } = await supabase
    .from('class_entries')
    .select('id, class_id, num, rider, horse, final_pct, collective_total, test_override')
    .in('class_id', classIds)
    .order('ride_order');
  if (entryError) throw entryError;

  const entriesByClass = new Map<string, typeof entries>();
  for (const e of entries) {
    const list = entriesByClass.get(e.class_id) ?? [];
    list.push(e);
    entriesByClass.set(e.class_id, list);
  }

  const rows: ShowResultRow[] = [];
  for (const cls of classes) {
    const classEntries = entriesByClass.get(cls.id) ?? [];
    const parsed = classEntries.map((e) => ({
      entryId: e.id,
      num: e.num,
      rider: e.rider ?? '—',
      horse: e.horse ?? '—',
      testName: extractResultTestName(e.test_override),
      pct: parseResultPct(e.final_pct),
      ctot: e.collective_total,
    }));
    const ranks = rankByTest(parsed);
    for (const e of parsed) {
      rows.push({
        classId: cls.id,
        className: cls.label,
        division: cls.division,
        entryId: e.entryId,
        num: e.num,
        rider: e.rider,
        horse: e.horse,
        testName: e.testName,
        pct: e.pct,
        rank: ranks.get(e.entryId) ?? null,
      });
    }
  }
  return rows;
}

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
    items.push({
      severity: 'warn',
      label: 'Not ready to go live',
      detail:
        'The waiver of liability hasn\'t been approved yet — go to Setup and click "Approve this waiver".',
      actionLabel: 'Fix it',
      href: setupHref,
    });
  }

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
      detail: "New bookings need review before they're confirmed.",
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
