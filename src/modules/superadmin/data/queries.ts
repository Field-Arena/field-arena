import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import type { PermissionKey } from '@/shared/constants/permissions';
import { resolveStaffPermissions, countEnabledPermissions } from '../utils';

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

  /**
   * Onboard vs pending, matching api/organizations.js line 461 exactly:
   *
   *   an accepted Organizer account   → onboard
   *   otherwise an outstanding invite → pending
   *   otherwise the org has shows     → onboard
   *   otherwise                       → pending
   *
   * The third tier is load-bearing and easy to miss. Organizations that predate
   * the invite flow have no account and no invite, but they have shows and are
   * plainly in business — the legacy comment calls them out as "legacy seed orgs
   * (no status field) count as onboard". Checking only for an account marks every
   * one of them Pending and offers a Resend-invite button for an invite that was
   * never sent.
   */
  const [organizerAccounts, openInvites] = await Promise.all([
    supabase.from('users').select('org_id').eq('platform_role', 'Organizer').not('org_id', 'is', null),
    supabase.from('invites').select('org_id').is('accepted_at', null).not('org_id', 'is', null),
  ]);
  if (organizerAccounts.error) throw organizerAccounts.error;
  if (openInvites.error) throw openInvites.error;

  const accountOrgs = new Set(organizerAccounts.data.map((row) => row.org_id));
  const pendingInviteOrgs = new Set(openInvites.data.map((row) => row.org_id));

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
      onboarded: accountOrgs.has(org.id)
        ? true
        : pendingInviteOrgs.has(org.id)
          ? false
          : orgShows.length > 0,
    };
  });
}

const LEAD_COLUMNS =
  'id, org_name, contact_name, email, phone, website, shows_per_year, status, cost_per_event, avg_revenue_per_show, notes, calendly_event_uri, demo_at, onboarding_at, onboarding_checklist, onboarding_email_sent_at, created_at, updated_at';

export async function listLeads() {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('leads')
    .select(LEAD_COLUMNS)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export type LeadRow = Awaited<ReturnType<typeof listLeads>>[number];

export async function getLead(id: string): Promise<LeadRow | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.from('leads').select(LEAD_COLUMNS).eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function listScoringCatalog() {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('scoring_catalog')
    .select('id, title, level, discipline, family, governing_body, source, source_file, updated_at')
    .order('title');
  if (error) throw error;
  return data;
}

export type CatalogSheetRow = Awaited<ReturnType<typeof listScoringCatalog>>[number];

export async function getScoringSheet(id: string) {
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

export type ScoringSheet = NonNullable<Awaited<ReturnType<typeof getScoringSheet>>>;

export interface CatalogDocument {
  id: string;
  folder: string;
  name: string;
  url: string | null;
  createdAt: string;
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

export interface PlatformAccount {
  id: string;
  name: string;
  email: string;
  role: string | null;
  createdAt: string;
  /**
   * `pending` means the account was provisioned but the person has never signed
   * in — they still owe the set-password step from their invite email. Legacy
   * drew the same line as "Active" vs "Invite pending".
   */
  status: 'active' | 'pending';
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

export interface DirectoryStaff {
  id: string;
  name: string;
  email: string | null;
  role: string;
  showId: string;
  showName: string;
  status: string | null;
  permissions: Record<PermissionKey, boolean>;
  permissionCount: number;
}

export interface DirectoryOrganizer {
  id: string;
  name: string;
  city: string | null;
  region: string | null;
  showCount: number;
  /** For the "Add a user" show picker — only this org's shows. */
  shows: { id: string; name: string }[];
  staff: DirectoryStaff[];
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
