import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';

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

export interface PlatformStats {
  organizations: number;
  activeOrganizations: number;
  shows: number;
  publishedShows: number;
  classes: number;
  entries: number;
  riders: number;
  staff: number;
  revenue: number;
  paidOrders: number;
}

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

export interface OrganizationSummary {
  id: string;
  name: string;
  city: string | null;
  region: string | null;
  currency: string | null;
  locale: string | null;
  suspended: boolean;
  isDemo: boolean;
  deletedAt: string | null;
  feeModel: string;
  showCount: number;
  entryCount: number;
  riderCount: number;
  /**
   * entries x avg_entry_value, matching the legacy console's "Revenue (est.)"
   * column. It is an estimate and labelled as one: the legacy ARCHITECTURE note
   * is explicit that these figures were never Stripe data. Settled revenue comes
   * from paid orders and is reported separately on the billing page.
   */
  revenueEstimate: number;
  /**
   * Whether an Organizer account has actually accepted for this organization.
   * Drives the Onboard/Pending pill: an organization can exist with shows
   * configured while its owner has never signed in, which is precisely the state
   * the "Resend invite" action exists for.
   */
  onboarded: boolean;
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

  // Which organizations have an Organizer who actually accepted their invite.
  const { data: organizerAccounts, error: accountsError } = await supabase
    .from('users')
    .select('org_id')
    .eq('platform_role', 'Organizer')
    .not('org_id', 'is', null);
  if (accountsError) throw accountsError;

  // .not('org_id', 'is', null) already excluded nulls, so no further filtering is
  // needed — and the generated types know it.
  const onboardedOrgs = new Set(organizerAccounts.map((row) => row.org_id));

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
      onboarded: onboardedOrgs.has(org.id),
    };
  });
}

export async function listLeads() {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('leads')
    .select(
      'id, org_name, contact_name, email, phone, shows_per_year, status, cost_per_event, avg_revenue_per_show, demo_at, onboarding_at, created_at'
    )
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function listScoringCatalog() {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('scoring_catalog')
    .select('id, title, level, discipline, family, governing_body, source_file, updated_at')
    .order('discipline')
    .order('title');
  if (error) throw error;
  return data;
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

export async function listPendingInvites() {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('invites')
    .select('id, email, role, name, org_id, show_id, created_at, expires_at')
    .is('accepted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}
