import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
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
      entryCount,
      riderCount: ridersByOrg.get(org.id)?.size ?? 0,
      revenueEstimate: entryCount * (org.avg_entry_value ?? 0),
      onboarded: signedInOrgs.has(org.id)
        ? true
        : accountOrgs.has(org.id)
          ? false
          : orgShows.length > 0,
    };
  });
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

  const connected = new Set(
    connect.data.filter((row) => row.stripe_connect_account_id).map((row) => row.id),
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
      stripeConnected: connected.has(org.id),
    };
  });
}

export async function getOrganizationBillingDetail(
  orgId: string,
): Promise<OrganizationBillingDetail | null> {
  const supabase = await createServerClient();
  const admin = createAdminClient();

  const [org, shows, connect] = await Promise.all([
    supabase
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
    stripeConnected: Boolean(connect.data?.stripe_connect_account_id),
    volume: showRows.reduce((sum, row) => sum + row.volume, 0),
    platformFee: showRows.reduce((sum, row) => sum + row.platformFee, 0),
    net: showRows.reduce((sum, row) => sum + row.net, 0),
    shows: showRows,
  };
}
