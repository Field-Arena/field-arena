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

/**
 * SuperAdmin console reads.
 *
 * Every query here goes through the *user's* client, not the service-role
 * client, so RLS applies and SuperAdmin's access is proven rather than assumed.
 * Using the admin client would bypass the policies and mean a broken policy
 * would never surface here.
 *
 * Note the explicit column lists on organizations. `select('*')` fails for an
 * authenticated role, because the RLS migration revokes column-level SELECT on
 * stripe_connect_account_id from `authenticated` — a payment identifier only
 * server-side code holding the service key should read. PostgREST asks for every
 * column when given '*', so the whole request is rejected with a permission
 * error rather than silently omitting the column.
 */

export async function getPlatformStats(): Promise<PlatformStats> {
  const supabase = await createServerClient();

  // head:true with an exact count returns only the count, no rows over the wire.
  // Written out per table rather than through a helper taking a table name: the
  // generated Database types make `from()` accept only a literal union of table
  // names, so a `(table: string)` helper cannot typecheck.
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

  // amount_total is NOT NULL and the generated types map numeric to number, so
  // no coercion or fallback is needed here.
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

/**
 * The organization tree the console opens on. Show and entry counts are derived
 * per organization rather than stored, so they cannot go stale — the legacy
 * schema kept a shows.entries_count column and its own comment flagged it as a
 * placeholder to be replaced by a computed count.
 */
export async function listOrganizations(): Promise<OrganizationSummary[]> {
  const supabase = await createServerClient();

  const { data: orgs, error } = await supabase
    .from('organizations')
    .select(
      'id, name, city, region, currency, locale, suspended, is_demo, deleted_at, fee_model, avg_entry_value, created_at'
    )
    .order('name');
  if (error) throw error;

  /**
   * Onboard vs pending, adapted from api/organizations.js line 461: that legacy
   * version read an `invites.accepted_at` bookkeeping row, but nothing in this
   * app ever writes that column (there is no separate accept-invite step —
   * createOrganization/resendOrganizerInvite provision the `users` row eagerly,
   * same as addSuperAdmin/addOrgStaff), so "an outstanding invite" is really
   * "an owner account that has never signed in." last_sign_in_at lives on
   * auth.users, unreachable through RLS, hence the one admin-client call here —
   * same reasoning as listPlatformAccounts below.
   *
   *   a signed-in Organizer account       → onboard
   *   an Organizer account, never signed in → pending
   *   otherwise the org has shows         → onboard
   *   otherwise                           → pending
   *
   * The third tier is load-bearing and easy to miss. Organizations that predate
   * the invite flow have no account at all, but they have shows and are plainly
   * in business — the legacy comment calls them out as "legacy seed orgs (no
   * status field) count as onboard". Checking only for a signed-in account marks
   * every one of them Pending and offers a Resend-invite button for an owner
   * account that was never created.
   */
  const [organizerAccounts, authList] = await Promise.all([
    supabase.from('users').select('id, org_id').eq('platform_role', 'Organizer').not('org_id', 'is', null),
    createAdminClient().auth.admin.listUsers({ page: 1, perPage: 200 }),
  ]);
  if (organizerAccounts.error) throw organizerAccounts.error;
  if (authList.error) throw authList.error;

  const signedInById = new Map(authList.data.users.map((u) => [u.id, Boolean(u.last_sign_in_at)]));
  const accountOrgs = new Set(organizerAccounts.data.map((row) => row.org_id));
  const signedInOrgs = new Set(
    organizerAccounts.data.filter((row) => signedInById.get(row.id)).map((row) => row.org_id)
  );

  // One round trip for every show, then counted in memory. With a handful of
  // organizations this beats a query per organization, which is the N+1 the
  // legacy codebase had a dedicated regression test for
  // (tests/showstaff-vendors-n-plus-1.spec.ts).
  const { data: shows, error: showsError } = await supabase
    .from('shows')
    .select('id, org_id');
  if (showsError) throw showsError;

  /**
   * Two flat selects joined in memory, deliberately not a PostgREST embed.
   *
   * `class_entries.select('classes!inner(show_id)')` fails with PGRST201:
   * there are two foreign keys between these tables — class_entries.class_id →
   * classes.id, and the holding-queue classes.working_in_entry_id →
   * class_entries.id — so the embed is ambiguous and has to be disambiguated by
   * constraint name. Selecting the two id columns and joining here needs no
   * constraint names in application code, and stays correct if either FK is
   * renamed.
   */
  const { data: classRows, error: classError } = await supabase
    .from('classes')
    .select('id, show_id');
  if (classError) throw classError;

  // `rider` comes along so distinct competitors can be counted per organization.
  // It is the display name rather than a rider_id because an organizer-imported
  // roster has no rider accounts behind it — the legacy schema documents that
  // text field as "the universal display source".
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
  // Distinct competitors per organization. A rider entered in three classes at
  // two of an organization's shows is one competitor, so this is a Set per
  // organization rather than a running count.
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
  const { data, error } = await supabase.from('leads').select(LEAD_COLUMNS).eq('id', id).maybeSingle();
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
      'id, title, level, discipline, family, source, source_file, governing_body, def, created_at, updated_at'
    )
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Every platform document, each with a fresh signed download URL.
 *
 * All through the caller's own client: catalog_documents_select and the
 * fa_catalog_docs_read storage policy both resolve SuperAdmin, so no admin
 * client is needed. The bucket is private, so a one-hour signed URL is minted
 * per row for the "View / Download" link.
 */
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
    })
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

/**
 * Every staff-side login on the platform — Super Admins, Organizers, and every
 * per-show role — with whether they have actually signed in yet.
 *
 * The role list comes through the caller's own client (RLS lets a SuperAdmin
 * read every users row). The signed-in-yet flag does not: `last_sign_in_at`
 * lives on auth.users, which the authenticated role cannot read through PostgREST
 * at all, so it can only come from the auth admin API. That single admin call is
 * the one deviation from this file's "user client only" rule, and it is
 * unavoidable — there is no RLS path to auth session metadata.
 */
export async function listPlatformAccounts(): Promise<PlatformAccount[]> {
  const supabase = await createServerClient();
  const { data: rows, error } = await supabase
    .from('users')
    .select('id, name, email, platform_role, created_at')
    .order('platform_role')
    .order('name');
  if (error) throw error;

  const admin = createAdminClient();
  const { data: authList, error: authError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (authError) throw authError;

  const signedInById = new Map(authList.users.map((u) => [u.id, Boolean(u.last_sign_in_at)]));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.platform_role,
    createdAt: row.created_at,
    status: signedInById.get(row.id) ? 'active' : 'pending',
  }));
}

/**
 * The "Organizer Staff Directory": every organizer, each with its shows and the
 * staff working across them. Ported from the legacy /all-staff view.
 *
 * All reads go through the caller's own client. A SuperAdmin passes can_view_show
 * for every show (is_super_admin short-circuits it), so staff_assignments returns
 * every row — no admin client needed. Three flat selects joined in memory rather
 * than a PostgREST embed: staff_assignments → shows has one FK, but grouping and
 * the per-org show list are both needed anyway, so one pass builds both.
 */
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
        'id, show_id, name, email, role, status, permissions, can_scratch_skip_dq, can_view_money'
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

// ── Billing ────────────────────────────────────────────────────────────────

/**
 * Platform billing, computed from paid orders.
 *
 * fee_total is READ, never recalculated. It is written once when the order is
 * created and is the figure the refund cap is enforced against
 * (orders_refund_within_cap). Recomputing it here from today's fee model would
 * silently disagree with what was actually charged the moment an organization's
 * model changes.
 *
 * Only 'paid' orders count toward money. Pending and failed rows are reported as
 * counts because they say something operational — a wall of pending orders means
 * checkout is breaking — but they are not revenue.
 */
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

/**
 * Per-organization billing.
 *
 * Orders reach an organization through their show, so the org id is embedded off
 * shows rather than stored on the order — there is no orders.org_id to read, and
 * adding one would be a second source of truth for something the show already
 * answers.
 *
 * Organizations are listed with explicit columns for the reason given at the top
 * of this file: '*' is rejected outright for an authenticated role.
 */
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
    connect.data.filter((row) => row.stripe_connect_account_id).map((row) => row.id)
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

/**
 * One organizer's billing: their Connect status, settlement settings, and what
 * every show of theirs has taken.
 *
 * Shows with no paid orders are still listed at zero. A show that sold nothing is
 * a real and interesting state on a reconciliation screen — omitting it would
 * make the page look like the show does not exist.
 */
export async function getOrganizationBillingDetail(
  orgId: string
): Promise<OrganizationBillingDetail | null> {
  const supabase = await createServerClient();
  const admin = createAdminClient();

  const [org, shows, connect] = await Promise.all([
    supabase
      .from('organizations')
      .select('id, name, city, region, currency, locale, fee_model, payout_cadence, holdback_percent')
      .eq('id', orgId)
      .maybeSingle(),
    supabase
      .from('shows')
      .select('id, name, start_date, end_date')
      .eq('org_id', orgId)
      .order('start_date', { ascending: false }),
    admin
      .from('organizations')
      .select('stripe_connect_account_id')
      .eq('id', orgId)
      .maybeSingle(),
  ]);

  if (org.error) throw org.error;
  if (shows.error) throw shows.error;
  if (connect.error) throw connect.error;
  if (!org.data) return null;

  const showIds = shows.data.map((show) => show.id);

  // `in` with an empty list is a syntax error in PostgREST, so the query is
  // skipped entirely for an organizer that has not built a show yet.
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
    // Nullable in the generated type despite the column default, so the
    // fallback is real rather than defensive.
    payoutCadence: org.data.payout_cadence ?? 'weekly',
    holdbackPercent: org.data.holdback_percent,
    stripeConnected: Boolean(connect.data?.stripe_connect_account_id),
    volume: showRows.reduce((sum, row) => sum + row.volume, 0),
    platformFee: showRows.reduce((sum, row) => sum + row.platformFee, 0),
    net: showRows.reduce((sum, row) => sum + row.net, 0),
    shows: showRows,
  };
}
