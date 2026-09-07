import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { getStripeClient, isStripeConfigured } from '@/shared/lib/stripe';
import { findCatalogMatch } from '@/modules/superadmin/utils/find-catalog-match';
import { resolveStaffPermissions } from '@/modules/superadmin/utils/resolve-staff-permissions';
import { countEnabledPermissions } from '@/modules/superadmin/utils/count-enabled-permissions';
import type {
  PlatformStats,
  OrganizationSummary,
  LeadRow,
  CatalogSheetRow,
  ScoringSheet,
  CatalogDocument,
  PlatformAccount,
  DirectoryStaff,
  DirectoryOrganizer,
  BillingSummary,
  OrganizationBilling,
  ShowBilling,
  OrganizationBillingDetail,
  StripeAccountStatus,
  StripePayout,
  OrganizationShow,
  OrganizationShowsDetail,
  ShowRosterRider,
  IndependentTestTemplate,
} from '@/modules/superadmin/types';

export async function getPlatformStats(): Promise<PlatformStats> {
  const supabase = await createServerClient();

  const [orgs, activeOrgs, shows, published, classes, entries, riders, staff, paid] =
    await Promise.all([
      supabase.from('organizations').select('id', { count: 'exact', head: true }),
      supabase
        .from('organizations')
        .select('id', { count: 'exact', head: true })
        .eq('suspended', false)
        .is('deleted_at', null),
      supabase.from('shows').select('id', { count: 'exact', head: true }),
      supabase.from('shows').select('id', { count: 'exact', head: true }).eq('published', true),
      supabase.from('classes').select('id', { count: 'exact', head: true }),
      supabase.from('class_entries').select('id', { count: 'exact', head: true }),
      supabase.from('riders').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('amount_total').eq('status', 'paid'),
    ]);

  const revenue = (paid.data ?? []).reduce((sum, row) => sum + row.amount_total, 0);

  return {
    organizations: orgs.count ?? 0,
    activeOrganizations: activeOrgs.count ?? 0,
    shows: shows.count ?? 0,
    publishedShows: published.count ?? 0,
    classes: classes.count ?? 0,
    entries: entries.count ?? 0,
    riders: riders.count ?? 0,
    staff: staff.count ?? 0,
    revenue,
    paidOrders: paid.data?.length ?? 0,
  };
}

export async function listOrganizations(): Promise<OrganizationSummary[]> {
  const supabase = await createServerClient();

  const { data: orgs, error } = await supabase
    .from('organizations')
    .select(
      'id, name, city, region, currency, locale, suspended, is_demo, deleted_at, fee_model, avg_entry_value, created_at',
    )
    .order('name');
  if (error) throw error;

  const organizerAccounts = await supabase
    .from('users')
    .select('id, org_id, onboarded_at')
    .eq('platform_role', 'Organizer')
    .not('org_id', 'is', null);
  if (organizerAccounts.error) throw organizerAccounts.error;

  const accountOrgs = new Set(organizerAccounts.data.map((row) => row.org_id));
  const signedInOrgs = new Set(
    organizerAccounts.data.filter((row) => row.onboarded_at).map((row) => row.org_id),
  );

  const { data: shows, error: showsError } = await supabase.from('shows').select('id, org_id');
  if (showsError) throw showsError;

  const { data: classRows, error: classError } = await supabase
    .from('classes')
    .select('id, show_id');
  if (classError) throw classError;

  const { data: entries, error: entriesError } = await supabase
    .from('class_entries')
    .select('id, class_id, rider');
  if (entriesError) throw entriesError;

  const { data: additionalOwnerRows, error: ownersError } = await supabase
    .from('organization_owners')
    .select('org_id, users(id, name, email)');
  if (ownersError) throw ownersError;

  const additionalOwnersByOrg = new Map<
    string,
    { userId: string; name: string; email: string }[]
  >();
  for (const row of additionalOwnerRows) {
    const user = row.users as { id: string; name: string; email: string } | null;
    if (!user) continue;
    const list = additionalOwnersByOrg.get(row.org_id) ?? [];
    list.push({ userId: user.id, name: user.name, email: user.email });
    additionalOwnersByOrg.set(row.org_id, list);
  }

  const showsByOrg = new Map<string, string[]>();
  for (const show of shows) {
    const list = showsByOrg.get(show.org_id) ?? [];
    list.push(show.id);
    showsByOrg.set(show.org_id, list);
  }

  const showByClass = new Map<string, string>();
  for (const row of classRows) {
    showByClass.set(row.id, row.show_id);
  }

  const showToOrg = new Map<string, string>();
  for (const [orgId, showIds] of showsByOrg) {
    for (const showId of showIds) showToOrg.set(showId, orgId);
  }

  const entriesByShow = new Map<string, number>();

  const ridersByOrg = new Map<string, Set<string>>();

  for (const entry of entries) {
    const showId = showByClass.get(entry.class_id);
    if (!showId) continue;
    entriesByShow.set(showId, (entriesByShow.get(showId) ?? 0) + 1);

    const orgId = showToOrg.get(showId);
    if (orgId && entry.rider) {
      const set = ridersByOrg.get(orgId) ?? new Set<string>();
      set.add(entry.rider);
      ridersByOrg.set(orgId, set);
    }
  }

  return orgs.map((org) => {
    const orgShows = showsByOrg.get(org.id) ?? [];
    const entryCount = orgShows.reduce((sum, id) => sum + (entriesByShow.get(id) ?? 0), 0);
    return {
      id: org.id,
      name: org.name,
      city: org.city,
      region: org.region,
      currency: org.currency,
      locale: org.locale,
      suspended: org.suspended,
      isDemo: org.is_demo,
      deletedAt: org.deleted_at,
      feeModel: org.fee_model,
      showCount: orgShows.length,
      // Legacy's "Riders" column was the sum of each show's entry count, and
      // its revenue estimate multiplied that same number by avgEntryValue.
      // Keep both derived from `entryCount` so the column and the money next
      // to it agree; distinct people are carried separately as riderCount.
      entryCount,
      riderCount: ridersByOrg.get(org.id)?.size ?? 0,
      revenueEstimate: entryCount * (org.avg_entry_value ?? 0),
      onboarded: signedInOrgs.has(org.id)
        ? true
        : accountOrgs.has(org.id)
          ? false
          : orgShows.length > 0,
      additionalOwners: additionalOwnersByOrg.get(org.id) ?? [],
    };
  });
}

/* Just enough to populate the console's organizer switcher: id, name and
 * location. Deliberately NOT listOrganizations() — that walks every show,
 * class and entry to build the overview table's counts, which is far too much
 * work to repeat on every dashboard render, and it drags in columns the
 * switcher has no use for. Keeping this narrow also means a switcher query can
 * never take the whole dashboard shell down with it. */
export async function listOrganizerOptions(): Promise<
  { id: string; name: string; location: string }[]
> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, city, region')
    .is('deleted_at', null)
    .eq('is_demo', false)
    .order('name');
  if (error) throw error;

  return data.map((org) => ({
    id: org.id,
    name: org.name,
    location: [org.city, org.region].filter(Boolean).join(', '),
  }));
}

const LEAD_COLUMNS =
  'id, org_name, contact_name, email, phone, website, shows_per_year, status, cost_per_event, avg_revenue_per_show, notes, calendly_event_uri, demo_at, onboarding_at, onboarding_checklist, onboarding_email_sent_at, created_at, updated_at';

export async function listLeads(): Promise<LeadRow[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('leads')
    .select(LEAD_COLUMNS)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getLead(id: string): Promise<LeadRow | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('leads')
    .select(LEAD_COLUMNS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listScoringCatalog(): Promise<CatalogSheetRow[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('scoring_catalog')
    .select('id, title, level, discipline, family, governing_body, source, source_file, updated_at')
    .order('title');
  if (error) throw error;
  return data;
}

export async function getScoringSheet(id: string): Promise<ScoringSheet | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('scoring_catalog')
    .select(
      'id, title, level, discipline, family, source, source_file, governing_body, def, created_at, updated_at',
    )
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listCatalogDocuments(): Promise<CatalogDocument[]> {
  const supabase = await createServerClient();
  const { data: rows, error } = await supabase
    .from('catalog_documents')
    .select('id, folder, name, path, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;

  return Promise.all(
    rows.map(async (row) => {
      const { data } = await supabase.storage.from('catalog-docs').createSignedUrl(row.path, 3600);
      return {
        id: row.id,
        folder: row.folder,
        name: row.name,
        url: data?.signedUrl ?? null,
        createdAt: row.created_at,
      };
    }),
  );
}

export async function listPlatformUsers() {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, platform_role, org_id, country, created_at')
    .order('platform_role')
    .order('name');
  if (error) throw error;
  return data;
}

export async function listPlatformAccounts(): Promise<PlatformAccount[]> {
  const supabase = await createServerClient();
  const { data: rows, error } = await supabase
    .from('users')
    .select('id, name, email, platform_role, created_at, onboarded_at')
    .order('platform_role')
    .order('name');
  if (error) throw error;

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.platform_role,
    createdAt: row.created_at,
    status: row.onboarded_at ? 'active' : 'pending',
  }));
}

export async function listOrganizerStaffDirectory(): Promise<DirectoryOrganizer[]> {
  const supabase = await createServerClient();

  const [orgsRes, showsRes, staffRes] = await Promise.all([
    supabase
      .from('organizations')
      .select('id, name, city, region')
      .is('deleted_at', null)
      .order('name'),
    supabase.from('shows').select('id, name, org_id'),
    supabase
      .from('staff_assignments')
      .select(
        'id, show_id, name, email, role, status, permissions, can_scratch_skip_dq, can_view_money',
      ),
  ]);
  if (orgsRes.error) throw orgsRes.error;
  if (showsRes.error) throw showsRes.error;
  if (staffRes.error) throw staffRes.error;

  const showById = new Map(showsRes.data.map((s) => [s.id, s]));

  const showsByOrg = new Map<string, { id: string; name: string }[]>();
  for (const show of showsRes.data) {
    const list = showsByOrg.get(show.org_id) ?? [];
    list.push({ id: show.id, name: show.name });
    showsByOrg.set(show.org_id, list);
  }

  const staffByOrg = new Map<string, DirectoryStaff[]>();
  for (const row of staffRes.data) {
    const show = showById.get(row.show_id);
    if (!show) continue;
    const resolved = resolveStaffPermissions(row);
    const staff: DirectoryStaff = {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      showId: row.show_id,
      showName: show.name,
      status: row.status,
      permissions: resolved,
      permissionCount: countEnabledPermissions(resolved),
    };
    const list = staffByOrg.get(show.org_id) ?? [];
    list.push(staff);
    staffByOrg.set(show.org_id, list);
  }

  return orgsRes.data.map((org) => {
    const shows = showsByOrg.get(org.id) ?? [];
    return {
      id: org.id,
      name: org.name,
      city: org.city,
      region: org.region,
      showCount: shows.length,
      shows,
      staff: (staffByOrg.get(org.id) ?? []).sort((a, b) => a.name.localeCompare(b.name)),
    };
  });
}

export async function getBillingSummary(): Promise<BillingSummary> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('orders')
    .select('amount_total, fee_total, refunded_amount, status');
  if (error) throw error;

  const paid = data.filter((row) => row.status === 'paid');

  const grossPaid = paid.reduce((sum, row) => sum + row.amount_total, 0);
  const platformFees = paid.reduce((sum, row) => sum + (row.fee_total ?? 0), 0);
  const refunded = paid.reduce((sum, row) => sum + (row.refunded_amount ?? 0), 0);

  return {
    grossPaid,
    platformFees,
    refunded,
    netToOrganizers: grossPaid - platformFees - refunded,
    paidOrders: paid.length,
    pendingOrders: data.filter((row) => row.status === 'pending').length,
    failedOrders: data.filter((row) => row.status === 'failed').length,
  };
}

/* Live Stripe Connect status for one connected account — the same call the
 * legacy GET /api/organizations/:id/stripe-status made. The five states are
 * load-bearing: an account that submitted details but can't yet charge is
 * `restricted` and needs chasing, which is invisible if you only ask "is there
 * an account id on file". Never throws: an unreachable Stripe degrades to
 * `error`, it does not take the billing page down. */
export async function getStripeAccountStatus(
  accountId: string | null,
): Promise<StripeAccountStatus> {
  if (!accountId)
    return { accountId: null, status: 'not_connected', payoutsEnabled: false, payouts: [] };
  if (!isStripeConfigured()) {
    return {
      accountId,
      status: 'error',
      payoutsEnabled: false,
      payouts: [],
      error: 'Stripe is not configured.',
    };
  }

  try {
    const stripe = getStripeClient();
    const [account, payoutList] = await Promise.all([
      stripe.accounts.retrieve(accountId),
      stripe.payouts.list({ limit: 5 }, { stripeAccount: accountId }),
    ]);

    let status: StripeAccountStatus['status'] = 'onboarding';
    if (account.charges_enabled && account.payouts_enabled) status = 'active';
    else if (account.details_submitted) status = 'restricted';

    const payouts: StripePayout[] = payoutList.data.map((p) => ({
      id: p.id,
      amount: p.amount / 100,
      currency: p.currency,
      status: p.status,
      arrivalDate: p.arrival_date ? p.arrival_date * 1000 : null,
    }));

    return { accountId, status, payoutsEnabled: account.payouts_enabled, payouts };
  } catch (error) {
    return {
      accountId,
      status: 'error',
      payoutsEnabled: false,
      payouts: [],
      error: error instanceof Error ? error.message : 'Could not reach Stripe.',
    };
  }
}

/** The next payout still in flight, if any — legacy's "Pending payout" column. */
export function nextPendingPayout(status: StripeAccountStatus): number {
  const next = status.payouts.find((p) => p.status === 'pending' || p.status === 'in_transit');
  return next?.amount ?? 0;
}

export async function listOrganizationBilling(): Promise<OrganizationBilling[]> {
  const supabase = await createServerClient();

  const admin = createAdminClient();

  const [orgs, orders, connect] = await Promise.all([
    supabase
      .from('organizations')
      .select('id, name, city, region, fee_model, currency, locale')
      .is('deleted_at', null)
      .order('name'),
    supabase
      .from('orders')
      .select('amount_total, fee_total, refunded_amount, shows!inner(org_id)')
      .eq('status', 'paid'),
    admin.from('organizations').select('id, stripe_connect_account_id'),
  ]);

  if (orgs.error) throw orgs.error;
  if (orders.error) throw orders.error;
  if (connect.error) throw connect.error;

  const accountByOrg = new Map(connect.data.map((row) => [row.id, row.stripe_connect_account_id]));

  // One live Stripe round-trip per connected account, in parallel. Orgs with
  // no account short-circuit inside getStripeAccountStatus without a call.
  const statuses = new Map<string, StripeAccountStatus>(
    await Promise.all(
      orgs.data.map(
        async (org) =>
          [org.id, await getStripeAccountStatus(accountByOrg.get(org.id) ?? null)] as const,
      ),
    ),
  );

  const byOrg = new Map<string, { count: number; gross: number; fee: number; refunded: number }>();
  for (const order of orders.data) {
    const orgId = order.shows.org_id;
    if (!orgId) continue;
    const bucket = byOrg.get(orgId) ?? { count: 0, gross: 0, fee: 0, refunded: 0 };
    bucket.count += 1;
    bucket.gross += order.amount_total;
    bucket.fee += order.fee_total ?? 0;
    bucket.refunded += order.refunded_amount ?? 0;
    byOrg.set(orgId, bucket);
  }

  return orgs.data.map((org) => {
    const totals = byOrg.get(org.id) ?? { count: 0, gross: 0, fee: 0, refunded: 0 };
    const stripe = statuses.get(org.id) ?? {
      accountId: null,
      status: 'not_connected' as const,
      payoutsEnabled: false,
      payouts: [],
    };
    return {
      id: org.id,
      name: org.name,
      city: org.city,
      region: org.region,
      feeModel: org.fee_model,
      currency: org.currency,
      locale: org.locale,
      paidOrders: totals.count,
      gross: totals.gross,
      platformFee: totals.fee,
      refunded: totals.refunded,
      net: totals.gross - totals.fee - totals.refunded,
      stripeConnected: stripe.status === 'active',
      stripeStatus: stripe.status,
      pendingPayout: nextPendingPayout(stripe),
    };
  });
}

export async function getOrganizationBillingDetail(
  orgId: string,
): Promise<OrganizationBillingDetail | null> {
  const supabase = await createServerClient();
  const admin = createAdminClient();

  const [org, shows, connect] = await Promise.all([
    // Settlement terms (payout_cadence / holdback_percent) are read through the
    // admin client alongside stripe_connect_account_id below, for the same
    // reason: they are platform-to-organizer terms, not data any ordinary
    // authenticated session should be able to select. The route is already
    // SuperAdmin-only, so this narrows the DB grant without narrowing access.
    admin
      .from('organizations')
      .select(
        'id, name, city, region, currency, locale, fee_model, payout_cadence, holdback_percent',
      )
      .eq('id', orgId)
      .maybeSingle(),
    supabase
      .from('shows')
      .select('id, name, start_date, end_date')
      .eq('org_id', orgId)
      .order('start_date', { ascending: false }),
    admin.from('organizations').select('stripe_connect_account_id').eq('id', orgId).maybeSingle(),
  ]);

  if (org.error) throw org.error;
  if (shows.error) throw shows.error;
  if (connect.error) throw connect.error;
  if (!org.data) return null;

  const showIds = shows.data.map((show) => show.id);

  const orders = showIds.length
    ? await supabase
        .from('orders')
        .select('show_id, amount_total, fee_total, refunded_amount')
        .eq('status', 'paid')
        .in('show_id', showIds)
    : { data: [], error: null };

  if (orders.error) throw orders.error;

  const byShow = new Map<string, { volume: number; fee: number; refunded: number }>();
  for (const order of orders.data) {
    const bucket = byShow.get(order.show_id) ?? { volume: 0, fee: 0, refunded: 0 };
    bucket.volume += order.amount_total;
    bucket.fee += order.fee_total ?? 0;
    bucket.refunded += order.refunded_amount ?? 0;
    byShow.set(order.show_id, bucket);
  }

  const stripe = await getStripeAccountStatus(connect.data?.stripe_connect_account_id ?? null);

  const showRows: ShowBilling[] = shows.data.map((show) => {
    const totals = byShow.get(show.id) ?? { volume: 0, fee: 0, refunded: 0 };
    return {
      id: show.id,
      name: show.name,
      startDate: show.start_date,
      endDate: show.end_date,
      volume: totals.volume,
      platformFee: totals.fee,
      net: totals.volume - totals.fee - totals.refunded,
    };
  });

  return {
    id: org.data.id,
    name: org.data.name,
    city: org.data.city,
    region: org.data.region,
    currency: org.data.currency,
    locale: org.data.locale,
    feeModel: org.data.fee_model,

    payoutCadence: org.data.payout_cadence ?? 'weekly',
    holdbackPercent: org.data.holdback_percent,
    stripeConnected: stripe.status === 'active',
    stripeStatus: stripe.status,
    stripeAccountId: stripe.accountId,
    payoutsEnabled: stripe.payoutsEnabled,
    payouts: stripe.payouts,
    stripeError: stripe.error ?? null,
    volume: showRows.reduce((sum, row) => sum + row.volume, 0),
    platformFee: showRows.reduce((sum, row) => sum + row.platformFee, 0),
    net: showRows.reduce((sum, row) => sum + row.net, 0),
    shows: showRows,
  };
}

/* ------------------------------------------------------------------ *
 * One organizer's shows, browsable from the console without dropping
 * into their workspace (legacy viewOrgShows / orgShowsHtml). The stage
 * pill mirrors the same setup/on-sale/live split the organizer sees.
 * ------------------------------------------------------------------ */
export async function getOrganizationShows(orgId: string): Promise<OrganizationShowsDetail | null> {
  const supabase = await createServerClient();

  const [orgRes, showsRes, ownerRes] = await Promise.all([
    supabase
      .from('organizations')
      .select('id, name, city, region, currency, locale')
      .eq('id', orgId)
      .maybeSingle(),
    supabase
      .from('shows')
      .select('id, name, start_date, end_date, published, runner_state')
      .eq('org_id', orgId)
      .order('start_date', { ascending: false }),
    supabase
      .from('users')
      .select('onboarded_at')
      .eq('org_id', orgId)
      .eq('platform_role', 'Organizer')
      .maybeSingle(),
  ]);
  if (orgRes.error) throw orgRes.error;
  if (showsRes.error) throw showsRes.error;
  if (ownerRes.error) throw ownerRes.error;
  if (!orgRes.data) return null;

  const showIds = showsRes.data.map((s) => s.id);

  const classRes = showIds.length
    ? await supabase.from('classes').select('id, show_id').in('show_id', showIds)
    : { data: [] as { id: string; show_id: string }[], error: null };
  if (classRes.error) throw classRes.error;

  const classIds = classRes.data.map((c) => c.id);
  const entryRes = classIds.length
    ? await supabase.from('class_entries').select('id, class_id, status').in('class_id', classIds)
    : { data: [] as { id: string; class_id: string; status: string | null }[], error: null };
  if (entryRes.error) throw entryRes.error;

  const showByClass = new Map(classRes.data.map((c) => [c.id, c.show_id]));
  const entriesByShow = new Map<string, number>();
  for (const entry of entryRes.data) {
    if (entry.status === 'scratched') continue;
    const showId = showByClass.get(entry.class_id);
    if (!showId) continue;
    entriesByShow.set(showId, (entriesByShow.get(showId) ?? 0) + 1);
  }

  const shows: OrganizationShow[] = showsRes.data.map((show) => {
    const runner = (show.runner_state ?? {}) as { approved?: boolean; ticketClosed?: boolean };
    const stage = runner.approved ? 'live' : show.published ? 'on-sale' : 'setup';
    return {
      id: show.id,
      name: show.name,
      startDate: show.start_date,
      endDate: show.end_date,
      stage,
      published: Boolean(show.published),
      entryCount: entriesByShow.get(show.id) ?? 0,
    };
  });

  return {
    id: orgRes.data.id,
    name: orgRes.data.name,
    city: orgRes.data.city,
    region: orgRes.data.region,
    currency: orgRes.data.currency,
    locale: orgRes.data.locale,
    // Same three-tier rule the list uses: a signed-in owner, else an account
    // that exists but hasn't accepted, else "has shows" for legacy orgs.
    onboarded: ownerRes.data?.onboarded_at != null || shows.length > 0,
    shows,
  };
}

/* Everyone entered in one show, grouped by rider + horse — legacy's Riders
 * node (loadRealRidersRoster). Scratched entries are excluded, exactly as
 * legacy did, so the roster reflects who is actually riding. class_entries
 * already carries plain rider/horse text, so there is no rider/horse join. */
export async function getShowRoster(showId: string): Promise<{
  showName: string;
  orgId: string;
  orgName: string;
  currency: string | null;
  locale: string | null;
  riders: ShowRosterRider[];
} | null> {
  const supabase = await createServerClient();

  const { data: show, error: showError } = await supabase
    .from('shows')
    .select('id, name, org_id, organizations(name, currency, locale)')
    .eq('id', showId)
    .maybeSingle();
  if (showError) throw showError;
  if (!show) return null;

  const { data: classes, error: classError } = await supabase
    .from('classes')
    .select('id, label, display_name, division, fee')
    .eq('show_id', showId);
  if (classError) throw classError;

  const classIds = classes.map((c) => c.id);
  const entriesRes = classIds.length
    ? await supabase
        .from('class_entries')
        .select('id, class_id, num, rider, horse, status, final_pct')
        .in('class_id', classIds)
    : { data: [], error: null };
  if (entriesRes.error) throw entriesRes.error;

  const classById = new Map(classes.map((c) => [c.id, c]));
  const byRider = new Map<string, ShowRosterRider>();

  for (const entry of entriesRes.data) {
    if (entry.status === 'scratched') continue;
    const riderName = entry.rider ?? 'Unnamed rider';
    const horse = entry.horse ?? '—';
    const key = `${riderName}||${horse}`;
    const cls = classById.get(entry.class_id);

    const rawPct = entry.final_pct;
    const pct =
      rawPct != null && rawPct !== 'SCR' && rawPct !== 'ELIM' && !Number.isNaN(Number(rawPct))
        ? Number(rawPct)
        : null;

    const current = byRider.get(key) ?? {
      key,
      num: entry.num,
      name: riderName,
      horse,
      entries: [],
      feeTotal: 0,
    };
    const fee = cls?.fee ?? 0;
    current.entries.push({
      className: cls?.display_name ?? cls?.label ?? entry.class_id,
      division: cls?.division ?? '',
      fee,
      percent: pct,
    });
    current.feeTotal += fee;
    byRider.set(key, current);
  }

  const org = show.organizations as unknown as {
    name: string;
    currency: string | null;
    locale: string | null;
  } | null;

  return {
    showName: show.name,
    orgId: show.org_id,
    orgName: org?.name ?? '',
    currency: org?.currency ?? null,
    locale: org?.locale ?? null,
    riders: [...byRider.values()].sort((a, b) => a.name.localeCompare(b.name)),
  };
}

/* Read-only, cross-org listing of every real Test Builder template, for the
 * catalog's Independent tab. SuperAdmin can only SEE these — editing stays in
 * each org's own Test Builder; this is visibility into what is already live
 * across the platform (legacy ?resource=all-test-templates). */
export async function listIndependentTestTemplates(): Promise<IndependentTestTemplate[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('test_templates')
    .select('id, name, level, source_label, org_id, created_at, organizations(name)')
    .order('created_at', { ascending: false });
  if (error) throw error;

  return data.map((row) => {
    const org = row.organizations as unknown as { name: string } | null;
    return {
      id: row.id,
      name: row.name,
      level: row.level,
      sourceLabel: row.source_label,
      orgId: row.org_id,
      orgName: org?.name ?? 'Unknown organizer',
      createdAt: row.created_at,
    };
  });
}

/* Which unmatched uploads would now match a catalog sheet if renamed — powers
 * the "Try to match again" action (legacy rematchUnmatchedUploads). */
export function planCatalogRematch(
  unmatched: { id: string; name: string }[],
  sheets: { id: string; title: string; sourceFile: string }[],
): { id: string; name: string; matchedTitle: string }[] {
  const plan: { id: string; name: string; matchedTitle: string }[] = [];
  for (const doc of unmatched) {
    const hit = findCatalogMatch(doc.name, sheets);
    if (hit?.sourceFile) plan.push({ id: doc.id, name: hit.sourceFile, matchedTitle: hit.title });
  }
  return plan;
}
