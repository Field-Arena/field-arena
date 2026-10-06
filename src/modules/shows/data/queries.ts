import 'server-only';
import { parseFinalPct } from '../utils/parse-final-pct';
import { fetchAllRows } from '@/modules/shows/data/fetch-all-rows';
import { createServerClient } from '@/shared/lib/supabase/server';
import { formatMoney } from '@/shared/lib/format/currency';
import { splitTicketClose } from '@/shared/lib/format/ticket-close';
import { resolveTimeZone, zonedDateTimeToUtc } from '@/shared/lib/format/time-zone';
import { collectibleFeeForEntry } from '@/modules/shows/utils/charged-class-fee';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { getStripeClient, isStripeConfigured } from '@/shared/lib/stripe';
import { isStaleAccountError } from '@/shared/lib/stripe-errors';
import { awardUnitsFor, type AwardClassInput } from '@/modules/shows/awards-engine';
import { ribbonFor, type RibbonColor } from '@/modules/shows/constants';
import { rankPlacings } from '@/shared/lib/rank-placings';
import type {
  ActivityItem,
  AttentionItem,
  DashboardReadiness,
  DashboardShowRow,
  IncompleteShowSummary,
  InventoryRow,
  OrgBilling,
  OrgPayoutRow,
  RunShowData,
  ShowListItem,
  ShowManagerVitals,
  ShowPickerSummary,
  ShowResultRow,
  ShowStats,
  StripeConnectStatus,
} from '@/modules/shows/types';

export async function listShowsForOrg(orgId: string): Promise<ShowListItem[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('shows')
    .select(
      'id, slug, name, date_label, start_date, end_date, status, published, venue_name, venue_id',
    )
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
    slug: show.slug,
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

  let entries: {
    rider: string | null;
    rider_id: string | null;
    horse: string | null;
    horse_id: string | null;
    class_id: string;
    order_id: string | null;
    status: string | null;
  }[] = [];
  if (classIds.length > 0) {
    entries = await fetchAllRows(() =>
      supabase
        .from('class_entries')
        .select('rider, rider_id, horse, horse_id, class_id, order_id, status')
        .in('class_id', classIds)
        .order('id'),
    );
  }

  const [{ count: vendorCount }, { data: paidOrders, error: orderError }] = await Promise.all([
    supabase
      .from('vendor_bookings')
      .select('id', { count: 'exact', head: true })
      .eq('show_id', showId)
      .eq('status', 'paid'),
    supabase
      .from('orders')
      .select('id, status, amount_total, items')
      .eq('show_id', showId)
      .eq('status', 'paid'),
  ]);
  if (orderError) throw orderError;

  /* A real account's entry can carry a blank denormalized name text (see
   * riders/ui/profile-tab.tsx — nothing in the app ever sets first_name/
   * last_name), which silently dropped every such rider from this Set when
   * it only read the text column. rider_id/horse_id are the real identity;
   * the text is only needed as a fallback for manual/legacy entries that
   * were never linked to a real riders/horses row. */
  const paidOrderById = new Map(paidOrders.map((o) => [o.id, o]));
  const riders = new Set(entries.map((e) => e.rider_id ?? e.rider).filter(Boolean));
  const horses = new Set(entries.map((e) => e.horse_id ?? e.horse).filter(Boolean));

  return {
    riders: riders.size,
    entries: entries.length,
    horses: horses.size,
    vendorSpaces: vendorCount ?? 0,
    testsOffered: classes.length,
    settledRevenue: paidOrders.reduce((sum, o) => sum + o.amount_total, 0),
    // What was actually charged (paid order line) or, if unpaid, the current
    // fee -- scratched entries aren't collectible.
    entryValue: entries.reduce(
      (sum, e) => sum + collectibleFeeForEntry(e, feeByClass.get(e.class_id) ?? 0, paidOrderById),
      0,
    ),
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

export async function getShowManagerVitals(showId: string): Promise<ShowManagerVitals> {
  const [stats, stage] = await Promise.all([getShowStats(showId), getShowStage(showId)]);
  return { stats, stage };
}

/* One batched pass across every show in the org — never N+1 per show. Stage
 * mirrors getShowStage()'s rules; rider counts mirror getShowStats()'s
 * rider_id-falls-back-to-rider identity rule, just grouped by show instead
 * of computed for one. */
export async function listDashboardShows(orgId: string): Promise<DashboardShowRow[]> {
  const supabase = await createServerClient();

  const { data: shows, error } = await supabase
    .from('shows')
    .select('id, slug, name, date_label, published, runner_state')
    .eq('org_id', orgId)
    .order('start_date', { ascending: false });
  if (error) throw error;
  if (shows.length === 0) return [];

  const showIds = shows.map((s) => s.id);

  const [{ data: classes, error: classError }, { data: publishedClasses, error: pubError }] =
    await Promise.all([
      supabase.from('classes').select('id, show_id').in('show_id', showIds),
      supabase
        .from('classes')
        .select('show_id')
        .in('show_id', showIds)
        .eq('results_published', true),
    ]);
  if (classError) throw classError;
  if (pubError) throw pubError;

  const completeShowIds = new Set(publishedClasses.map((c) => c.show_id));
  const showIdByClassId = new Map(classes.map((c) => [c.id, c.show_id]));
  const classIds = classes.map((c) => c.id);

  const ridersByShow = new Map<string, Set<string>>();
  if (classIds.length > 0) {
    const entries = await fetchAllRows(() =>
      supabase
        .from('class_entries')
        .select('rider, rider_id, class_id')
        .in('class_id', classIds)
        .order('id'),
    );
    for (const e of entries) {
      const showId = showIdByClassId.get(e.class_id);
      if (!showId) continue;
      const key = e.rider_id ?? e.rider;
      if (!key) continue;
      const set = ridersByShow.get(showId) ?? new Set<string>();
      set.add(key);
      ridersByShow.set(showId, set);
    }
  }

  return shows.map((show) => {
    const runner = (show.runner_state ?? {}) as { approved?: boolean; ticketClosed?: boolean };
    const stage = completeShowIds.has(show.id)
      ? 'complete'
      : runner.approved
        ? 'live'
        : runner.ticketClosed
          ? 'sales-closed'
          : show.published
            ? 'sales-open'
            : 'setup';

    return {
      id: show.id,
      slug: show.slug,
      name: show.name,
      dateLabel: show.date_label,
      stage,
      riderCount: ridersByShow.get(show.id)?.size ?? 0,
    };
  });
}

export async function getDashboardReadiness(showId: string): Promise<DashboardReadiness> {
  const supabase = await createServerClient();

  const [{ data: show, error: showError }, { data: judges, error: judgeError }] = await Promise.all(
    [
      supabase.from('shows').select('runner_state').eq('id', showId).maybeSingle(),
      supabase.from('staff_assignments').select('status').eq('show_id', showId).eq('role', 'Judge'),
    ],
  );
  if (showError) throw showError;
  if (judgeError) throw judgeError;

  const runner = (show?.runner_state ?? {}) as { approved?: boolean };

  return {
    schedulePublished: runner.approved === true,
    judgesTotal: judges.length,
    judgesAccepted: judges.filter((j) => j.status === 'accepted').length,
  };
}

export async function getRunShowData(showId: string): Promise<RunShowData | null> {
  const supabase = await createServerClient();

  const showResult = await supabase
    .from('shows')
    .select(
      'id, slug, name, published, published_at, runner_state, waiver_text, waiver_approved_text',
    )
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
    showSlug: show.slug,
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

export async function listIncompleteShowsForOrg(orgId: string): Promise<IncompleteShowSummary[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('shows')
    .select('id, slug, name, date_label, start_date, venue_name')
    .eq('org_id', orgId)
    .eq('published', false)
    .order('start_date', { ascending: true, nullsFirst: false });
  if (error) throw error;

  return data.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    dateLabel: s.date_label,
    startDate: s.start_date,
    venueName: s.venue_name,
  }));
}

export async function listShowsForPicker(orgId: string): Promise<ShowPickerSummary[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('shows')
    .select('id, slug, name, date_label, start_date, venue_name, published, runner_state')
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
      slug: s.slug,
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

function ticketCloseAt(value: string | null, tz: string): number | null {
  if (!value) return null;
  const { date, time: clock } = splitTicketClose(value);
  if (!date) return null;
  return zonedDateTimeToUtc(date, clock || '23:59', tz)?.getTime() ?? null;
}

function extractResultTestName(override: unknown): string | null {
  if (!override || typeof override !== 'object') return null;
  const name = (override as Record<string, unknown>).name;
  return typeof name === 'string' && name.trim() ? name : null;
}

// Same rule as Awards: anything that isn't a real percentage is unplaced.
const parseResultPct = parseFinalPct;

/* Rank within test, not within the whole class — the shared placing rule. */
function rankByTest(
  rows: { entryId: string; testName: string | null; pct: number | null; ctot: number | null }[],
): Map<string, number> {
  return new Map(rankPlacings(rows).map((r) => [r.entryId, r.rank]));
}

/* Every class's confirmed scores for the whole show, ranked per test within
 * each class — this is the source for the organizer-facing CSV export
 * (Show Manager → Results). Unscored entries (no final_pct yet) are still
 * listed with pct/rank null, so the export doubles as a full-roster sheet,
 * not just a winners list.
 *
 * Classes sharing an award_scope of 'division'/'group' (the same pooling
 * the Awards screen already uses, via awardUnitsFor) are ranked together
 * as one combined placing here too — previously this ranked strictly per
 * class, so a class configured to share a championship with others still
 * showed separate, wrong placings/ribbons on this screen. */
export async function getShowResults(showId: string): Promise<ShowResultRow[]> {
  const supabase = await createServerClient();

  const { data: classes, error: classError } = await supabase
    .from('classes')
    .select('id, label, division, group_name, award_scope, ribbon_places, ribbon_colors')
    .eq('show_id', showId)
    .order('label');
  if (classError) throw classError;
  if (classes.length === 0) return [];

  const classIds = classes.map((c) => c.id);
  const entries = await fetchAllRows(() =>
    supabase
      .from('class_entries')
      .select(
        'id, class_id, num, rider, rider_id, horse, final_pct, collective_total, test_override',
      )
      .in('class_id', classIds)
      .order('ride_order')
      .order('id'),
  );

  // entry.rider is a denormalized text snapshot that can be blank for a real
  // account (nothing captures a rider's own first/last name at signup —
  // only the waiver's typed signature does, and only from here on). Resolve
  // through the real riders row first, falling back to the text/email chain
  // used elsewhere in this codebase, rather than showing a blank name.
  const riderIds = [...new Set(entries.map((e) => e.rider_id).filter((id): id is string => !!id))];
  const { data: riderRows, error: ridersError } = riderIds.length
    ? await supabase.from('riders').select('id, first_name, last_name, email').in('id', riderIds)
    : { data: [], error: null };
  if (ridersError) throw ridersError;
  const riderById = new Map(riderRows.map((r) => [r.id, r]));

  function resolveRiderName(e: { rider: string | null; rider_id: string | null }): string {
    const riderRow = e.rider_id ? riderById.get(e.rider_id) : undefined;
    const fromAccount = riderRow
      ? [riderRow.first_name, riderRow.last_name].filter(Boolean).join(' ')
      : '';
    return [fromAccount, e.rider, riderRow?.email].find((v) => v?.trim()) ?? '—';
  }

  const entriesByClass = new Map<string, typeof entries>();
  for (const e of entries) {
    const list = entriesByClass.get(e.class_id) ?? [];
    list.push(e);
    entriesByClass.set(e.class_id, list);
  }

  const classById = new Map(classes.map((c) => [c.id, c]));

  const awardInputs: AwardClassInput[] = classes.map((c) => ({
    id: c.id,
    label: c.label,
    awardScope: c.award_scope,
    division: c.division,
    groupName: c.group_name,
    ribbonPlaces: c.ribbon_places ?? 6,
    ribbonColors: c.ribbon_colors as RibbonColor[] | null,
    entries: [],
  }));
  const units = awardUnitsFor(awardInputs);

  const rows: ShowResultRow[] = [];
  for (const unit of units) {
    const unitEntries = unit.classes.flatMap((cls) =>
      (entriesByClass.get(cls.id) ?? []).map((e) => ({ ...e, classId: cls.id })),
    );
    const parsed = unitEntries.map((e) => ({
      entryId: e.id,
      classId: e.classId,
      num: e.num,
      rider: resolveRiderName(e),
      horse: e.horse ?? '—',
      testName: extractResultTestName(e.test_override),
      pct: parseResultPct(e.final_pct),
      ctot: e.collective_total,
    }));
    const ranks = rankByTest(parsed);
    for (const e of parsed) {
      const cls = classById.get(e.classId);
      const rank = ranks.get(e.entryId) ?? null;
      const earnsRibbon = rank !== null && rank <= unit.ribbonPlaces;
      const ribbon = earnsRibbon ? ribbonFor(rank - 1, unit.ribbonColors) : null;
      rows.push({
        unitLabel: unit.label,
        pooled: unit.pooled,
        classId: e.classId,
        className: cls?.label ?? unit.label,
        division: cls?.division ?? null,
        entryId: e.entryId,
        num: e.num,
        rider: e.rider,
        horse: e.horse,
        testName: e.testName,
        pct: e.pct,
        rank,
        ribbonPlace: ribbon?.place ?? null,
        ribbonName: ribbon?.name ?? null,
        ribbonBg: ribbon?.bg ?? null,
        ribbonFg: ribbon?.fg ?? null,
      });
    }
  }
  return rows;
}

export async function getShowAttention(showId: string): Promise<AttentionItem[]> {
  const supabase = await createServerClient();

  // Neither query depends on the other's result -- both only need showId.
  const [{ data: show, error }, { data: classes, error: classesError }] = await Promise.all([
    supabase
      .from('shows')
      .select(
        'id, name, published, ticket_close, timezone, runner_state, waiver_text, waiver_approved_text, organizations(timezone)',
      )
      .eq('id', showId)
      .maybeSingle(),
    supabase.from('classes').select('id').eq('show_id', showId),
  ]);
  if (error) throw error;
  if (classesError) throw classesError;
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

  const closeAt = ticketCloseAt(
    show.ticket_close,
    resolveTimeZone(
      show.timezone,
      (show.organizations as { timezone: string | null } | null)?.timezone,
    ),
  );
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

  let entryCount = 0;
  const classIds = classes.map((c) => c.id);
  if (classIds.length > 0) {
    const { count } = await supabase
      .from('class_entries')
      .select('id', { count: 'exact', head: true })
      .in('class_id', classIds);
    entryCount = count ?? 0;
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

/* The dashboard's "Recent activity" feed. There is no organizer-readable
 * event log (audit_log is SuperAdmin-only), so the feed is assembled from the
 * timestamps real rows already carry: orders placed, staff added, schedule
 * changes, and results published. */
export async function getShowActivity(showId: string, limit = 5): Promise<ActivityItem[]> {
  const supabase = await createServerClient();

  const [orders, staff, classes] = await Promise.all([
    supabase
      .from('orders')
      .select('created_at, amount_total, status')
      .eq('show_id', showId)
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('staff_assignments')
      .select('created_at, name, first_name, last_name, role, status')
      .eq('show_id', showId)
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('classes')
      .select('display_name, label, arena, schedule_updated_at, results_published_at')
      .eq('show_id', showId),
  ]);
  if (orders.error) throw orders.error;
  if (staff.error) throw staff.error;
  if (classes.error) throw classes.error;

  const items: ActivityItem[] = [];

  for (const o of orders.data) {
    if (!o.created_at) continue;
    const paid = o.status === 'paid';
    items.push({
      at: o.created_at,
      title: `${paid ? 'Paid order' : 'New order'} · ${formatMoney(o.amount_total)}`,
      tone: 'brand',
    });
  }

  for (const s of staff.data) {
    const name = s.name || [s.first_name, s.last_name].filter(Boolean).join(' ') || 'Staff';
    items.push({
      at: s.created_at,
      title: s.status === 'accepted' ? `${s.role} ${name} confirmed` : `${s.role} ${name} invited`,
      tone: 'violet',
    });
  }

  // One row per ring for schedule changes (a rebuild touches every class in
  // it), one per class for published results.
  const latestByRing = new Map<string, string>();
  for (const c of classes.data) {
    if (c.schedule_updated_at) {
      const ring = c.arena ?? 'Schedule';
      const prev = latestByRing.get(ring);
      if (!prev || prev < c.schedule_updated_at) latestByRing.set(ring, c.schedule_updated_at);
    }
    if (c.results_published_at) {
      items.push({
        at: c.results_published_at,
        title: `Results published · ${c.display_name ?? c.label}`,
        tone: 'amber',
      });
    }
  }
  for (const [ring, at] of latestByRing) {
    items.push({ at, title: `Schedule updated · ${ring}`, tone: 'sky' });
  }

  return items.sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, limit);
}

/** A show's display name, or null when missing / not visible to the caller. */
export async function getShowName(showId: string): Promise<string | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('shows')
    .select('name')
    .eq('id', showId)
    .maybeSingle();
  if (error) throw error;
  return data?.name ?? null;
}

/** Ring names from a show's `locations` (falling back to "Ring N"). */
export async function getShowRingNames(showId: string): Promise<string[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('shows')
    .select('locations')
    .eq('id', showId)
    .maybeSingle();
  if (error) throw error;
  return ((data?.locations ?? []) as { name?: string; num?: number }[])
    .map((loc) => loc.name ?? (loc.num ? `Ring ${String(loc.num)}` : null))
    .filter((name): name is string => !!name);
}

/** The raw `stable_chart` JSON; callers run it through normalizeStableChart. */
export async function getShowStableChartRaw(showId: string): Promise<unknown> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('shows')
    .select('stable_chart')
    .eq('id', showId)
    .maybeSingle();
  if (error) throw error;
  return data?.stable_chart ?? null;
}
