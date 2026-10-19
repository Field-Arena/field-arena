import 'server-only';
import { fetchAllRows } from '@/modules/shows/data/fetch-all-rows';
import { parseFinalPct } from '@/modules/shows/utils/parse-final-pct';
import { hasSheetContent } from '@/modules/shows/utils/has-sheet-content';
import { rideTestCode } from '@/modules/shows/utils/schedule-level';
import {
  collectibleFeeForEntry,
  isScratched,
  type ChargeableOrder,
} from '@/modules/shows/utils/charged-class-fee';
import { createServerClient } from '@/shared/lib/supabase/server';
import { splitTicketClose } from '@/shared/lib/format/ticket-close';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import {
  DEFAULT_SHOW_EXPENSES,
  PNL_CATEGORY_ORDER,
  DEFAULT_SCHEDULE_PREFS,
  UPPER_LEVELS,
  type RibbonColor,
} from '@/modules/shows/constants';
import { SHOW_DOCS_BUCKET } from '@/shared/constants/storage';
import { buildMasterSchedule, type ScheduleEntry } from '@/modules/shows/schedule-engine';
import {
  buildAwardsReport,
  disciplineOf,
  type AwardClassInput,
  type AwardEntry,
  type AwardsReport,
} from '@/modules/shows/awards-engine';
import { calcPlatformFee } from '@/shared/lib/fees';
import { GOVERNING_BODIES } from '@/modules/shows/schemas';

/** Drops any value outside the current governing-body enum before it ever
 * reaches a form. A stale/legacy value stored on an old show would otherwise
 * get round-tripped straight back through updateShowDetailsSchema's strict
 * z.enum() on the very next save of *any* field on that show — including
 * ones the organizer never touched — and fail with a validation error. */
function sanitizeGoverningBodies(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string =>
    (GOVERNING_BODIES as readonly string[]).includes(v as string),
  );
}
import {
  additionalRefundedTotal,
  netCollected,
  SETTLED_ORDER_STATUS,
  SETTLED_BOOKING_STATUS,
} from '@/shared/lib/sales-math';
import type {
  ClassTestStatus,
  AssignedClassOption,
  ClassRow,
  CompletenessSection,
  DivisionRow,
  DocumentRequirement,
  DocumentsPageData,
  EntryListRow,
  MasterScheduleData,
  MerchItem,
  PnlCategory,
  PnlLineItem,
  RiderDocumentInfo,
  RiderEntriesData,
  RiderListRow,
  RingRow,
  SalesCatalog,
  SchedulePrefs,
  ScheduleReviewClassRow,
  ScheduleReviewData,
  SelectEventsData,
  ShowAwards,
  ShowBilling,
  ShowCompleteness,
  ShowDocumentRow,
  ShowEntries,
  ShowExpense,
  ShowManagerHeader,
  ShowPnl,
  ShowRiders,
  ShowSetupDetail,
  StaffRow,
  TemplatePenalty,
  TemplateScoringConfig,
  TemplateSection,
  TestBuilderPageData,
  TestCatalogEntry,
  TestTemplateCollective,
  TestTemplateMovement,
  TestTemplateRow,
  TicketWindowData,
  VenueOption,
} from '@/modules/shows/types';

/* Just enough to render the Show Manager shell's title/tab-strip from the
 * layout -- name only, not the full show record any individual tab needs.
 * Kept separate from each tab's own (much larger) data fetch so the shell
 * doesn't force every tab to pull in data only some of them use. */
export async function getShowManagerHeader(showId: string): Promise<ShowManagerHeader | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('shows')
    .select('id, name')
    .eq('id', showId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listClasses(showId: string): Promise<ClassRow[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('classes')
    .select(
      'id, label, display_name, division, location, fee, judges_count, date, time, scoring_open, results_published, ribbon_places, award_scope, run_order',
    )
    .eq('show_id', showId)
    .order('label');
  if (error) throw error;

  if (data.length === 0) return [];

  const entries = await fetchAllRows(() =>
    supabase
      .from('class_entries')
      .select('class_id')
      .in(
        'class_id',
        data.map((c) => c.id),
      )
      .order('id'),
  );

  const counts = new Map<string, number>();
  for (const entry of entries) {
    counts.set(entry.class_id, (counts.get(entry.class_id) ?? 0) + 1);
  }

  return data.map((c) => ({
    id: c.id,
    label: c.label,
    displayName: c.display_name,
    division: c.division,
    location: c.location,
    fee: c.fee ?? 0,
    judgesCount: c.judges_count ?? 1,
    date: c.date,
    time: c.time,
    entryCount: counts.get(c.id) ?? 0,
    scoringOpen: c.scoring_open ?? false,
    resultsPublished: c.results_published ?? false,
    ribbonPlaces: c.ribbon_places ?? 6,
    awardScope: c.award_scope,
    runOrder: c.run_order,
  }));
}

export async function listDivisions(showId: string): Promise<DivisionRow[]> {
  const supabase = await createServerClient();

  const [divisions, classes] = await Promise.all([
    supabase
      .from('divisions')
      .select('id, name, position, default_fee')
      .eq('show_id', showId)
      .order('position'),
    supabase.from('classes').select('division').eq('show_id', showId),
  ]);
  if (divisions.error) throw divisions.error;
  if (classes.error) throw classes.error;

  const counts = new Map<string, number>();
  for (const row of classes.data) {
    if (row.division) counts.set(row.division, (counts.get(row.division) ?? 0) + 1);
  }

  return divisions.data.map((d) => ({
    id: d.id,
    name: d.name,
    position: d.position ?? 0,
    classCount: counts.get(d.name) ?? 0,
    defaultFee: d.default_fee,
  }));
}

export async function listStaff(showId: string): Promise<StaffRow[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('staff_assignments')
    .select(
      'id, name, role, email, phone, status, is_steward, user_id, can_view_money, can_scratch_skip_dq',
    )
    .eq('show_id', showId)
    .order('role')
    .order('name');
  if (error) throw error;

  return data.map((s) => ({
    id: s.id,
    name: s.name,
    role: s.role,
    email: s.email,
    phone: s.phone,
    status: s.status ?? 'pending',
    isSteward: s.is_steward ?? false,

    accepted: s.user_id !== null,
    canViewMoney: s.can_view_money ?? false,
    canScratchSkipDq: s.can_scratch_skip_dq ?? false,
  }));
}

export async function getSalesCatalog(showId: string): Promise<SalesCatalog> {
  const supabase = await createServerClient();

  const [addOns, qualTypes, vendorItems, show, merchSales] = await Promise.all([
    supabase
      .from('add_ons')
      .select('id, name, price, enabled, qty')
      .eq('show_id', showId)
      .order('name'),
    supabase
      .from('qual_types')
      .select('id, name, price, enabled')
      .eq('show_id', showId)
      .order('name'),
    supabase
      .from('vendor_items')
      .select('id, name, price, enabled, qty')
      .eq('show_id', showId)
      .order('name'),
    supabase.from('shows').select('merchandise_enabled, merch_items').eq('id', showId).single(),
    supabase.from('merch_sales').select('total').eq('show_id', showId),
  ]);

  if (addOns.error) throw addOns.error;
  if (qualTypes.error) throw qualTypes.error;
  if (vendorItems.error) throw vendorItems.error;
  if (show.error) throw show.error;
  if (merchSales.error) throw merchSales.error;

  return {
    addOns: addOns.data.map((a) => ({
      id: a.id,
      name: a.name,
      price: a.price ?? 0,
      enabled: a.enabled ?? true,
      qty: a.qty,
    })),
    qualTypes: qualTypes.data.map((q) => ({
      id: q.id,
      name: q.name,
      price: q.price ?? 0,
      enabled: q.enabled ?? false,
      qty: null,
    })),
    vendorItems: vendorItems.data.map((v) => ({
      id: v.id,
      name: v.name,
      price: v.price ?? 0,
      enabled: v.enabled ?? true,
      qty: v.qty,
    })),
    merchItems: (show.data.merch_items ?? []) as { id: string; name: string; price: number }[],
    merchEnabled: show.data.merchandise_enabled ?? false,
    merchSalesTotal: merchSales.data.reduce((sum, m) => sum + m.total, 0),
  };
}

export async function listShowDocuments(showId: string): Promise<ShowDocumentRow[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('documents')
    .select('id, name, path, url, event_ids, created_at')
    .eq('show_id', showId)
    .order('name');
  if (error) throw error;

  // Most rows already carry a stored url; only legacy rows without one need
  // signing. Batch those into a single storage call instead of one
  // createSignedUrl() round-trip per document.
  const pathsNeedingUrl = [...new Set(data.filter((d) => !d.url && d.path).map((d) => d.path))];
  const signedUrlByPath = new Map<string, string>();
  if (pathsNeedingUrl.length > 0) {
    const { data: signedUrls } = await supabase.storage
      .from('documents')
      .createSignedUrls(pathsNeedingUrl, 3600);
    for (const s of signedUrls ?? []) {
      if (s.path && s.signedUrl) signedUrlByPath.set(s.path, s.signedUrl);
    }
  }

  return data.map((d) => ({
    id: d.id,
    name: d.name,
    url: d.url ?? (d.path ? (signedUrlByPath.get(d.path) ?? null) : null),
    path: d.path,
    eventIds: (d.event_ids ?? []) as unknown as string[],
    createdAt: d.created_at,
  }));
}

export async function getDocumentsPageData(showId: string): Promise<DocumentsPageData | null> {
  const supabase = await createServerClient();

  const show = await supabase.from('shows').select('id, name').eq('id', showId).maybeSingle();
  if (show.error) throw show.error;
  if (!show.data) return null;

  const [documents, classes] = await Promise.all([listShowDocuments(showId), listClasses(showId)]);

  return {
    showId: show.data.id,
    showName: show.data.name,
    documents,
    classes: classes.map((c) => ({ id: c.id, label: c.displayName ?? c.label })),
  };
}

export async function getDocumentRequirements(showId: string): Promise<DocumentRequirement[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('shows')
    .select('document_requirements')
    .eq('id', showId)
    .single();
  if (error) throw error;

  return (data.document_requirements ?? []) as unknown as DocumentRequirement[];
}

/* Riders have no read access to the `documents` storage bucket (RLS there
 * is staff-only, via can_view_show) — a signed URL generated with the admin
 * client is what lets a rider actually open the file, same pattern as
 * resolveVendorMapUrl in modules/vendors/data/queries.ts. */
async function resolveWaiverDocumentUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data } = await createAdminClient()
    .storage.from(SHOW_DOCS_BUCKET)
    .createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export async function getShowSetupDetail(showId: string): Promise<ShowSetupDetail | null> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('shows')
    .select(
      'id, slug, org_id, name, show_details, show_type, start_date, end_date, timezone, starting_rider_number, governing_bodies, venue_id, venue_name, locations, schedule_prefs, day_start_times, day_end_times, document_requirements, merchandise_enabled, merch_items, waiver_text, waiver_approved_text, waiver_document_path, waiver_document_name',
    )
    .eq('id', showId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const showDetails = (data.show_details ?? {}) as {
    org?: string;
    website?: string;
    phone?: string;
    contactEmail?: string;
    prizeListUrl?: string;
  };
  const prefs = (data.schedule_prefs ?? {}) as Partial<SchedulePrefs>;

  return {
    id: data.id,
    slug: data.slug,
    orgId: data.org_id,
    name: data.name,
    org: showDetails.org ?? null,
    showType: (data.show_type as 'rated' | 'schooling' | null) ?? 'rated',
    startDate: data.start_date,
    endDate: data.end_date,
    timezone: data.timezone,
    startingRiderNumber: data.starting_rider_number ?? 101,
    governingBodies: sanitizeGoverningBodies(data.governing_bodies),
    venueId: data.venue_id,
    venueName: data.venue_name,
    locations: (data.locations ?? []) as unknown as RingRow[],
    schedulePrefs: { ...DEFAULT_SCHEDULE_PREFS, ...prefs },
    dayStartTimes: (data.day_start_times ?? []) as unknown as string[],
    dayEndTimes: (data.day_end_times ?? []) as unknown as string[],
    website: showDetails.website ?? null,
    phone: showDetails.phone ?? null,
    contactEmail: showDetails.contactEmail ?? null,
    prizeListUrl: showDetails.prizeListUrl ?? null,
    documentRequirements: (data.document_requirements ?? []) as unknown as DocumentRequirement[],
    merchandiseEnabled: data.merchandise_enabled ?? false,
    merchItems: (data.merch_items ?? []) as unknown as MerchItem[],
    waiverText: data.waiver_text,
    waiverApprovedText: data.waiver_approved_text,
    waiverDocumentUrl: await resolveWaiverDocumentUrl(data.waiver_document_path),
    waiverDocumentName: data.waiver_document_name,
  };
}

// Any organization's venue, not just the caller's own -- a venue isn't
// exclusive to whoever created it (see 20260924120000_shared_venues.sql).
// Show Setup's "Add stables from a saved location" picker uses this to let
// an organizer reuse a venue another org already set up.
/* Venues are shared across every organization (see
 * 20260924120000_shared_venues.sql), but that must not surface venues that
 * belong to a soft-deleted org (dangling data with no real owner left to
 * maintain it) or another org's demo data (Field-Arena's own seed/
 * walkthrough venues -- never a real, usable venue for an actual client
 * picking one for their show). The viewer's own org is always included
 * even if it happens to be a demo org itself (e.g. the internal demo
 * walkthrough account), so this never hides an organizer's own venues from
 * them -- it only filters OTHER orgs' demo clutter out of the shared list. */
export async function listSharedVenues(viewerOrgId: string): Promise<VenueOption[]> {
  const supabase = await createServerClient();

  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('id')
    .is('deleted_at', null)
    .or(`is_demo.eq.false,id.eq.${viewerOrgId}`);
  if (orgsError) throw orgsError;
  const orgIds = orgs.map((o) => o.id);
  if (orgIds.length === 0) return [];

  const { data, error } = await supabase
    .from('venues')
    .select('id, name, rings')
    .in('org_id', orgIds)
    .order('name');
  if (error) throw error;

  return data.map((v) => ({
    id: v.id,
    name: v.name,
    rings: (v.rings ?? []) as unknown as RingRow[],
  }));
}

interface ShowCompletenessInput {
  name: string | null;
  org: string;
  startDate: string | null;
  endDate: string | null;
  timezone: string | null;
  showType: string;
  governingBodies: string[];
  locationsCount: number;
  divisionsCount: number;
  classesCount: number;
  documentRequirementsCount: number;
  staffCount: number;
  merchEnabled: boolean;
  merchItemsCount: number;
  waiverApproved: boolean;
}

function computeShowCompleteness(input: ShowCompletenessInput): ShowCompleteness {
  const governingBodiesOk = input.showType !== 'rated' || input.governingBodies.length > 0;

  const sections: CompletenessSection[] = [
    {
      name: 'Show Details',
      items: [
        { label: 'Show name', ok: !!input.name },
        { label: 'Organization / club name', ok: !!input.org },
        { label: 'Start date', ok: !!input.startDate },
        { label: 'End date', ok: !!input.endDate },
        { label: 'Time zone', ok: !!input.timezone },
        { label: 'Governing bodies', ok: governingBodiesOk },
      ],
      ok:
        !!input.name &&
        !!input.org &&
        !!input.startDate &&
        !!input.endDate &&
        !!input.timezone &&
        governingBodiesOk,
    },
    {
      name: 'Venue',
      items: [{ label: 'At least one ring/arena', ok: input.locationsCount > 0 }],
      ok: input.locationsCount > 0,
    },
    {
      name: 'Class Divisions',
      items: [{ label: 'At least one division', ok: input.divisionsCount > 0 }],
      ok: input.divisionsCount > 0,
    },
    {
      name: 'Select Events',
      items: [{ label: 'At least one class open for entry', ok: input.classesCount > 0 }],
      ok: input.classesCount > 0,
    },
    {
      name: 'Required Documents',
      items: [
        { label: 'At least one requirement listed', ok: input.documentRequirementsCount > 0 },
      ],
      ok: input.documentRequirementsCount > 0,
    },
    {
      /* "No merchandise sales" is itself a complete, deliberate answer — this
       * used to require merchEnabled to be true, so an organizer who
       * correctly selected "No" saw this flagged as unfinished forever, with
       * no way to ever clear it. The only genuinely incomplete state is
       * "Yes" with no items actually added yet. */
      name: 'Merchandise Sales',
      items: [
        {
          label: input.merchEnabled ? 'At least one item added' : 'Marked as no merchandise sales',
          ok: !input.merchEnabled || input.merchItemsCount > 0,
        },
      ],
      ok: !input.merchEnabled || input.merchItemsCount > 0,
    },
    {
      name: 'Staffing',
      items: [{ label: 'At least one staff member assigned', ok: input.staffCount > 0 }],
      ok: input.staffCount > 0,
    },
    {
      name: 'Waiver of Liability',
      items: [{ label: 'Approved, matching the current text', ok: input.waiverApproved }],
      ok: input.waiverApproved,
    },
  ];

  return { sections, complete: sections.every((s) => s.ok) };
}

/* Computes completeness for every show already loaded on the page, from
 * data the page already fetched — zero extra queries. Use this instead of
 * getShowCompleteness whenever divisions/classes/staff/show detail are
 * already in hand (e.g. the show manager's own Setup page). */
export function completenessFromLoadedShow(input: {
  show: Pick<
    ShowSetupDetail,
    | 'name'
    | 'org'
    | 'startDate'
    | 'endDate'
    | 'timezone'
    | 'showType'
    | 'governingBodies'
    | 'locations'
    | 'documentRequirements'
    | 'merchandiseEnabled'
    | 'merchItems'
    | 'waiverText'
    | 'waiverApprovedText'
  >;
  divisions: DivisionRow[];
  classes: ClassRow[];
  staff: StaffRow[];
}): ShowCompleteness {
  const { show, divisions, classes, staff } = input;
  return computeShowCompleteness({
    name: show.name,
    org: show.org ?? '',
    startDate: show.startDate,
    endDate: show.endDate,
    timezone: show.timezone,
    showType: show.showType,
    governingBodies: show.governingBodies,
    locationsCount: show.locations.length,
    divisionsCount: divisions.length,
    classesCount: classes.length,
    documentRequirementsCount: show.documentRequirements.length,
    staffCount: staff.length,
    merchEnabled: show.merchandiseEnabled,
    merchItemsCount: show.merchItems.length,
    waiverApproved: !!show.waiverApprovedText && show.waiverApprovedText === show.waiverText,
  });
}

/* Batched completeness for a list of shows -- e.g. the show picker and the
 * incomplete-shows screen, both of which used to call getShowCompleteness
 * once per show (6 queries each), turning a page with N shows into 6N+
 * queries. This runs exactly 4 queries total regardless of how many shows
 * are passed in. */
export async function getShowsCompleteness(
  showIds: string[],
): Promise<Map<string, ShowCompleteness>> {
  const result = new Map<string, ShowCompleteness>();
  if (showIds.length === 0) return result;

  const supabase = await createServerClient();

  const [shows, divisions, classes, staff] = await Promise.all([
    supabase
      .from('shows')
      .select(
        'id, name, start_date, end_date, timezone, locations, waiver_text, waiver_approved_text, show_details, show_type, governing_bodies, document_requirements, merchandise_enabled, merch_items',
      )
      .in('id', showIds),
    supabase.from('divisions').select('show_id').in('show_id', showIds),
    supabase.from('classes').select('show_id').in('show_id', showIds),
    supabase.from('staff_assignments').select('show_id').in('show_id', showIds),
  ]);
  if (shows.error) throw shows.error;
  if (divisions.error) throw divisions.error;
  if (classes.error) throw classes.error;
  if (staff.error) throw staff.error;

  const countByShow = (rows: { show_id: string }[]) => {
    const counts = new Map<string, number>();
    for (const row of rows) counts.set(row.show_id, (counts.get(row.show_id) ?? 0) + 1);
    return counts;
  };
  const divisionCounts = countByShow(divisions.data);
  const classCounts = countByShow(classes.data);
  const staffCounts = countByShow(staff.data);

  for (const show of shows.data) {
    const locations = (show.locations ?? []) as unknown as RingRow[];
    const org = ((show.show_details ?? {}) as { org?: string }).org ?? '';
    const governingBodies = (show.governing_bodies ?? []) as unknown as string[];
    const documentRequirements = (show.document_requirements ??
      []) as unknown as DocumentRequirement[];
    const merchItems = (show.merch_items ?? []) as unknown as MerchItem[];
    const waiverApproved =
      !!show.waiver_approved_text && show.waiver_approved_text === show.waiver_text;

    result.set(
      show.id,
      computeShowCompleteness({
        name: show.name,
        org,
        startDate: show.start_date,
        endDate: show.end_date,
        timezone: show.timezone,
        showType: show.show_type ?? 'schooling',
        governingBodies,
        locationsCount: locations.length,
        divisionsCount: divisionCounts.get(show.id) ?? 0,
        classesCount: classCounts.get(show.id) ?? 0,
        documentRequirementsCount: documentRequirements.length,
        staffCount: staffCounts.get(show.id) ?? 0,
        merchEnabled: show.merchandise_enabled ?? false,
        merchItemsCount: merchItems.length,
        waiverApproved,
      }),
    );
  }

  return result;
}

export async function getShowCompleteness(showId: string): Promise<ShowCompleteness> {
  const map = await getShowsCompleteness([showId]);
  const completeness = map.get(showId);
  if (!completeness) throw new Error('Show not found.');
  return completeness;
}

export async function getShowBilling(showId: string): Promise<ShowBilling> {
  const supabase = await createServerClient();

  const [orders, show, merch, vendors, classes] = await Promise.all([
    supabase
      .from('orders')
      .select('amount_total, additional_charges_total, additional_charges, refunded_amount')
      .eq('show_id', showId)
      .eq('status', SETTLED_ORDER_STATUS),
    supabase.from('shows').select('expenses').eq('id', showId).single(),
    supabase.from('merch_sales').select('total').eq('show_id', showId),
    supabase
      .from('vendor_bookings')
      .select('amount_total, additional_charges_total, additional_charges, refunded_amount')
      .eq('show_id', showId)
      .eq('status', SETTLED_BOOKING_STATUS),
    supabase.from('classes').select('id, fee').eq('show_id', showId),
  ]);

  if (orders.error) throw orders.error;
  if (show.error) throw show.error;
  if (merch.error) throw merch.error;
  if (vendors.error) throw vendors.error;
  if (classes.error) throw classes.error;

  let entryValue = 0;
  if (classes.data.length > 0) {
    const feeByClass = new Map(classes.data.map((c) => [c.id, c.fee ?? 0]));
    const entries = await fetchAllRows(() =>
      supabase
        .from('class_entries')
        .select('class_id, horse_id, order_id, status')
        .in(
          'class_id',
          classes.data.map((c) => c.id),
        )
        .order('id'),
    );
    const orderIds = [
      ...new Set(entries.map((e) => e.order_id).filter((id): id is string => !!id)),
    ];
    const orderById = new Map<string, ChargeableOrder>();
    for (let i = 0; i < orderIds.length; i += 200) {
      const { data, error } = await supabase
        .from('orders')
        .select('id, status, items')
        .in('id', orderIds.slice(i, i + 200));
      if (error) throw error;
      for (const o of data) orderById.set(o.id, o);
    }
    // Charged price (paid order line) else the current fee; scratched entries
    // aren't collectible.
    entryValue = entries.reduce(
      (sum, e) => sum + collectibleFeeForEntry(e, feeByClass.get(e.class_id) ?? 0, orderById),
      0,
    );
  }

  const expenses = (show.data.expenses ?? []) as { id: string; label: string; amount: number }[];

  return {
    settledRevenue: orders.data.reduce(
      (sum, o) =>
        sum +
        netCollected({
          amountTotal: o.amount_total,
          additionalChargesTotal: o.additional_charges_total,
          refundedAmount: o.refunded_amount,
          additionalRefundedTotal: additionalRefundedTotal(o.additional_charges),
        }),
      0,
    ),
    paidOrders: orders.data.length,
    entryValue,
    vendorRevenue: vendors.data.reduce(
      (sum, v) =>
        sum +
        netCollected({
          amountTotal: v.amount_total,
          additionalChargesTotal: v.additional_charges_total,
          refundedAmount: v.refunded_amount,
          additionalRefundedTotal: additionalRefundedTotal(v.additional_charges),
        }),
      0,
    ),
    merchRevenue: merch.data.reduce((sum, m) => sum + m.total, 0),
    expenses,
    expenseTotal: expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
  };
}

// Lives on Run Show, not Select Events -- scheduling when sales open/close
// belongs with the manual open/close controls it's read alongside there,
// not off in a screen about which classes are offered.
export async function getTicketWindowData(showId: string): Promise<TicketWindowData | null> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('shows')
    .select('id, ticket_open, ticket_close')
    .eq('id', showId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { date: closeDate, time: closeTime } = splitTicketClose(data.ticket_close);

  return {
    showId: data.id,
    ticketOpen: data.ticket_open ?? '',
    ticketCloseDate: closeDate,
    ticketCloseTime: closeTime,
  };
}

export async function getSelectEventsData(showId: string): Promise<SelectEventsData | null> {
  const supabase = await createServerClient();

  const [show, classes, divisions] = await Promise.all([
    supabase.from('shows').select('id, name, locations').eq('id', showId).maybeSingle(),
    supabase
      .from('classes')
      .select(
        'id, label, division, group_name, fee, location, event, governing_body, display_name, qualifying',
      )
      .eq('show_id', showId)
      .order('label'),
    supabase
      .from('divisions')
      .select('id, name, default_fee')
      .eq('show_id', showId)
      .order('position'),
  ]);
  if (show.error) throw show.error;
  if (!show.data) return null;
  if (classes.error) throw classes.error;
  if (divisions.error) throw divisions.error;

  const rings = (show.data.locations ?? []) as unknown as RingRow[];

  // Entry counts drive the Entries column and guard removals — a class with
  // riders in it can't be dropped from here.
  const entryCounts = new Map<string, number>();
  if (classes.data.length > 0) {
    const entries = await fetchAllRows(() =>
      supabase
        .from('class_entries')
        .select('class_id')
        .in(
          'class_id',
          classes.data.map((c) => c.id),
        )
        .order('id'),
    );
    for (const e of entries) entryCounts.set(e.class_id, (entryCounts.get(e.class_id) ?? 0) + 1);
  }

  return {
    showId: show.data.id,
    showName: show.data.name,
    ringNames: rings.map((r) => r.name).filter((n): n is string => !!n),
    divisions: divisions.data.map((d) => ({ id: d.id, name: d.name, defaultFee: d.default_fee })),
    classes: classes.data.map((c) => ({
      id: c.id,
      label: c.label,
      division: c.division,
      groupName: c.group_name,
      fee: c.fee ?? 0,
      location: c.location,
      event: c.event,
      governingBody: c.governing_body,
      displayName: c.display_name,
      qualifying: c.qualifying ?? false,
      entryCount: entryCounts.get(c.id) ?? 0,
    })),
  };
}

export async function getRiderEntriesData(showId: string): Promise<RiderEntriesData | null> {
  const supabase = await createServerClient();

  const [show, addOns, vendorItems, qualTypes] = await Promise.all([
    supabase
      .from('shows')
      .select(
        'id, name, published, start_date, end_date, waiver_text, waiver_approved_text, logo_path, show_image_path, vendor_map_path, vendor_map_url',
      )
      .eq('id', showId)
      .maybeSingle(),
    supabase
      .from('add_ons')
      .select('id, name, price, stalls, tack')
      .eq('show_id', showId)
      .order('name'),
    supabase
      .from('vendor_items')
      .select('id, name, price, qty')
      .eq('show_id', showId)
      .order('name'),
    supabase.from('qual_types').select('id, name, price').eq('show_id', showId).order('name'),
  ]);
  if (show.error) throw show.error;
  if (!show.data) return null;
  if (addOns.error) throw addOns.error;
  if (vendorItems.error) throw vendorItems.error;
  if (qualTypes.error) throw qualTypes.error;

  const s = show.data;

  let notPublishedReason: string | null = null;
  if (!s.published) {
    const waiverApproved = !!s.waiver_approved_text && s.waiver_approved_text === s.waiver_text;
    notPublishedReason =
      !s.start_date || !s.end_date
        ? "the show dates in Setup aren't set yet"
        : !waiverApproved
          ? "the waiver of liability in Setup hasn't been approved yet"
          : "it hasn't been published yet";
  }

  const logoUrl = s.logo_path
    ? supabase.storage.from('logos').getPublicUrl(s.logo_path).data.publicUrl
    : null;
  const bannerUrl = s.show_image_path
    ? supabase.storage.from('show-images').getPublicUrl(s.show_image_path).data.publicUrl
    : null;

  let vendorMapUrl: string | null = null;
  if (s.vendor_map_path) {
    const { data } = await supabase.storage
      .from('vendor-maps')
      .createSignedUrl(s.vendor_map_path, 3600);
    vendorMapUrl = data?.signedUrl ?? null;
  } else if (s.vendor_map_url) {
    vendorMapUrl = s.vendor_map_url;
  }

  return {
    showId: s.id,
    showName: s.name,
    published: s.published ?? false,
    notPublishedReason,
    logoUrl,
    bannerUrl,
    vendorMapUrl,
    addOns: addOns.data.map((a) => ({
      id: a.id,
      name: a.name,
      price: a.price ?? 0,
      stalls: a.stalls ?? 0,
      tack: a.tack ?? 0,
    })),
    vendorSpaces: vendorItems.data.map((v) => ({
      id: v.id,
      name: v.name,
      price: v.price ?? 0,
      qty: v.qty,
    })),
    qualifications: qualTypes.data.map((q) => ({ id: q.id, name: q.name, price: q.price ?? 0 })),
  };
}

export async function getScheduleReviewData(showId: string): Promise<ScheduleReviewData | null> {
  const supabase = await createServerClient();

  const showResult = await supabase
    .from('shows')
    .select('id, name, org_id, locations')
    .eq('id', showId)
    .maybeSingle();
  if (showResult.error) throw showResult.error;
  if (!showResult.data) return null;
  const show = showResult.data;

  const [org, classes] = await Promise.all([
    supabase.from('organizations').select('fee_model').eq('id', show.org_id).maybeSingle(),
    supabase
      .from('classes')
      .select(
        'id, event, label, display_name, division, location, arena, judges_count, fee, sponsor',
      )
      .eq('show_id', showId)
      .order('label'),
  ]);
  if (org.error) throw org.error;
  if (classes.error) throw classes.error;

  const classIds = classes.data.map((c) => c.id);
  let counts = new Map<string, number>();
  // Scratched entries still show in the per-class count, but aren't money.
  const activeCounts = new Map<string, number>();
  if (classIds.length > 0) {
    const entries = await fetchAllRows(() =>
      supabase
        .from('class_entries')
        .select('class_id, status')
        .in('class_id', classIds)
        .order('id'),
    );
    counts = new Map();
    for (const entry of entries) {
      counts.set(entry.class_id, (counts.get(entry.class_id) ?? 0) + 1);
      if (!isScratched(entry)) {
        activeCounts.set(entry.class_id, (activeCounts.get(entry.class_id) ?? 0) + 1);
      }
    }
  }

  const feeModel = org.data?.fee_model ?? 'default';
  const rows: ScheduleReviewClassRow[] = classes.data.map((c) => {
    const fee = c.fee ?? 0;
    return {
      id: c.id,
      event: c.event,
      label: c.label,
      displayName: c.display_name,
      division: c.division,
      location: c.location,
      arena: c.arena,
      judgesCount: c.judges_count ?? 1,
      fee,
      platformFee: calcPlatformFee(fee, feeModel),
      entryCount: counts.get(c.id) ?? 0,
      sponsor: c.sponsor,
    };
  });

  const rings = (show.locations ?? []) as unknown as RingRow[];

  const totals = rows.reduce(
    (acc, r) => {
      const collectible = activeCounts.get(r.id) ?? 0;
      return {
        classCount: acc.classCount + 1,
        entryCount: acc.entryCount + r.entryCount,
        grossFees: acc.grossFees + r.fee * collectible,
        platformFees: acc.platformFees + r.platformFee * collectible,
      };
    },
    { classCount: 0, entryCount: 0, grossFees: 0, platformFees: 0 },
  );

  return { showId: show.id, showName: show.name, classes: rows, rings, feeModel, totals };
}

export async function listTestTemplates(orgId: string): Promise<TestTemplateRow[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('test_templates')
    .select(
      'id, name, level, source_label, movements, collectives, updated_at, discipline, sheet_type, governing_body, version_year, arena_size, ride_time, scoring_method, max_points, sections, penalties, scoring_config',
    )
    .eq('org_id', orgId)
    .order('name');
  if (error) throw error;

  return data.map((t) => ({
    id: t.id,
    name: t.name,
    level: t.level,
    sourceLabel: t.source_label,
    movements: (t.movements ?? []) as unknown as TestTemplateMovement[],
    collectives: (t.collectives ?? []) as unknown as TestTemplateCollective[],
    updatedAt: t.updated_at,
    discipline: t.discipline ?? null,
    sheetType: t.sheet_type ?? null,
    governingBody: t.governing_body ?? null,
    versionYear: t.version_year ?? null,
    arenaSize: t.arena_size ?? null,
    rideTime: t.ride_time ?? null,
    scoringMethod: t.scoring_method ?? null,
    maxPoints: t.max_points ?? null,
    sections: (t.sections ?? []) as unknown as TemplateSection[],
    penalties: (t.penalties ?? []) as unknown as TemplatePenalty[],
    scoringConfig: (t.scoring_config ?? null) as unknown as TemplateScoringConfig | null,
  }));
}

function parseCatalogDef(def: unknown): {
  movements: TestTemplateMovement[];
  collectives: TestTemplateCollective[];
} {
  const record = def && typeof def === 'object' ? (def as Record<string, unknown>) : {};

  const rawMovements = Array.isArray(record.movements) ? record.movements : [];
  const movements = rawMovements
    .filter((m): m is Record<string, unknown> => !!m && typeof m === 'object')
    .map((m) => ({
      num: Number(m.n ?? 0),
      text: typeof m.text === 'string' ? m.text : '',
      coef: Number(m.coef ?? 1),
    }))
    .filter((m) => m.num > 0);

  const rawCollectives = Array.isArray(record.collectives) ? record.collectives : [];
  const collectives = rawCollectives
    .filter((c): c is Record<string, unknown> => !!c && typeof c === 'object')
    .map((c) => ({
      key: typeof c.key === 'string' ? c.key : '',
      label: typeof c.label === 'string' ? c.label : '',
      coef: Number(c.coef ?? 1),
    }))
    .filter((c) => c.key !== '');

  return { movements, collectives };
}

export async function listTestCatalog(): Promise<TestCatalogEntry[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('scoring_catalog')
    .select('id, title, level, governing_body, def')
    .eq('family', 'movement')
    .order('title');
  if (error) throw error;

  return data.map((row) => {
    const { movements, collectives } = parseCatalogDef(row.def);
    return {
      id: row.id,
      title: row.title,
      level: row.level,
      governingBody: row.governing_body,
      movements,
      collectives,
    };
  });
}

export async function getTestBuilderPageData(showId: string): Promise<TestBuilderPageData | null> {
  const supabase = await createServerClient();

  const show = await supabase
    .from('shows')
    .select('id, name, org_id')
    .eq('id', showId)
    .maybeSingle();
  if (show.error) throw show.error;
  if (!show.data) return null;

  const [templates, catalog, classesRes] = await Promise.all([
    listTestTemplates(show.data.org_id),
    listTestCatalog(),
    supabase
      .from('classes')
      .select('id, label, division, fee, location, catalog_id')
      .eq('show_id', showId)
      .order('label'),
  ]);
  if (classesRes.error) throw classesRes.error;

  const classIds = classesRes.data.map((c) => c.id);
  const catalogIds = [
    ...new Set(classesRes.data.map((c) => c.catalog_id).filter((id): id is string => !!id)),
  ];
  const [classTestsRes, linkedSheetsRes] = await Promise.all([
    classIds.length
      ? supabase
          .from('class_tests')
          .select('class_id, name, test_template_id')
          .in('class_id', classIds)
      : Promise.resolve({ data: [], error: null }),
    catalogIds.length
      ? supabase.from('scoring_catalog').select('id, def').in('id', catalogIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (classTestsRes.error) throw classTestsRes.error;
  if (linkedSheetsRes.error) throw linkedSheetsRes.error;

  const classIdsWithTest = new Set(classTestsRes.data.map((row) => row.class_id));
  const classIdsWithTemplate = new Set(
    classTestsRes.data.filter((row) => row.test_template_id).map((row) => row.class_id),
  );
  const scorableSheetIds = new Set(
    linkedSheetsRes.data.filter((row) => hasSheetContent(row.def)).map((row) => row.id),
  );
  // Same precedence scoring uses: a Test Builder test (class_tests) wins over
  // the class's official catalog sheet. A class_tests row with no template is
  // either startRide's frozen copy of the catalog sheet (still the official
  // test) or a test typed in on the scoring page (custom).
  const testStatusFor = (c: { id: string; catalog_id: string | null }): ClassTestStatus => {
    if (classIdsWithTemplate.has(c.id)) return 'custom';
    if (c.catalog_id && scorableSheetIds.has(c.catalog_id)) return 'official';
    if (classIdsWithTest.has(c.id)) return 'custom';
    return 'none';
  };
  const classLabelById = new Map(classesRes.data.map((c) => [c.id, c.label]));
  const assignedByTemplateId: Record<string, AssignedClassOption[]> = {};
  for (const row of classTestsRes.data) {
    if (!row.test_template_id) continue;
    const label = classLabelById.get(row.class_id);
    if (!label) continue;
    const option: AssignedClassOption = { classId: row.class_id, label };
    (assignedByTemplateId[row.test_template_id] ??= []).push(option);
  }

  return {
    showId: show.data.id,
    showName: show.data.name,
    orgId: show.data.org_id,
    templates,
    catalog,
    classes: classesRes.data.map((c) => ({ id: c.id, label: c.label })),
    selectedClasses: classesRes.data.map((c) => ({
      id: c.id,
      label: c.label,
      division: c.division,
      fee: c.fee ?? 0,
      location: c.location,
      testStatus: testStatusFor(c),
    })),
    assignedByTemplateId,
  };
}

export async function getShowPnl(showId: string): Promise<ShowPnl | null> {
  const supabase = await createServerClient();

  const [show, classes, entries, orders, addOns, vendorItems, bookings, merchSales] =
    await Promise.all([
      supabase
        .from('shows')
        .select('id, name, expenses, merch_items')
        .eq('id', showId)
        .maybeSingle(),
      supabase.from('classes').select('id, label, division, event, fee').eq('show_id', showId),

      supabase.from('classes').select('id').eq('show_id', showId),
      supabase
        .from('orders')
        .select(
          'id, status, items, amount_total, additional_charges_total, additional_charges, refunded_amount',
        )
        .eq('show_id', showId),
      supabase.from('add_ons').select('id, name').eq('show_id', showId),
      supabase.from('vendor_items').select('id, name, price').eq('show_id', showId),
      supabase
        .from('vendor_bookings')
        .select(
          'id, status, paid_at, amount_total, additional_charges_total, additional_charges, refunded_amount, vendor_booking_items(vendor_item_id, qty)',
        )
        .eq('show_id', showId),
      supabase.from('merch_sales').select('items, total').eq('show_id', showId),
    ]);

  if (show.error) throw show.error;
  if (!show.data) return null;

  if (classes.error) throw classes.error;
  if (entries.error) throw entries.error;
  if (orders.error) throw orders.error;
  if (addOns.error) throw addOns.error;
  if (vendorItems.error) throw vendorItems.error;
  if (bookings.error) throw bookings.error;
  if (merchSales.error) throw merchSales.error;

  const categories = new Map<string, Map<string, PnlLineItem[]>>();
  const push = (category: string, sub: string, item: PnlLineItem) => {
    if (item.revenue === 0 && item.qty === 0) return;
    const subs = categories.get(category) ?? new Map<string, PnlLineItem[]>();
    categories.set(category, subs);
    subs.set(sub, [...(subs.get(sub) ?? []), item]);
  };

  const paidOrderIds = new Set(orders.data.filter((o) => o.status === 'paid').map((o) => o.id));
  const entryCounts = new Map<string, number>();
  const classIds = entries.data.map((c) => c.id);
  if (classIds.length > 0) {
    const rows = await fetchAllRows(() =>
      supabase
        .from('class_entries')
        .select('class_id, status, order_id')
        .in('class_id', classIds)
        .order('id'),
    );

    for (const entry of rows) {
      if (entry.status === 'scratched') continue;
      if (!entry.order_id || !paidOrderIds.has(entry.order_id)) continue;
      entryCounts.set(entry.class_id, (entryCounts.get(entry.class_id) ?? 0) + 1);
    }
  }
  for (const cls of classes.data) {
    const qty = entryCounts.get(cls.id) ?? 0;
    push('Entry Fees', cls.event ?? 'Other classes', {
      label: cls.division ? `${cls.label} — ${cls.division}` : cls.label,
      qty,
      revenue: qty * (cls.fee ?? 0),
    });
  }

  const addOnTotals = new Map<string, { qty: number; revenue: number }>();
  for (const order of orders.data) {
    if (order.status !== 'paid') continue;
    const items = (order.items ?? []) as {
      kind?: string;
      refId?: string;
      qty?: number;
      amount?: number;
    }[];
    for (const item of items) {
      if (item.kind !== 'addon' || !item.refId) continue;
      const current = addOnTotals.get(item.refId) ?? { qty: 0, revenue: 0 };
      addOnTotals.set(item.refId, {
        qty: current.qty + (item.qty ?? 0),
        revenue: current.revenue + (item.amount ?? 0),
      });
    }
  }
  for (const addOn of addOns.data) {
    const totals = addOnTotals.get(addOn.id) ?? { qty: 0, revenue: 0 };
    push('Add-ons & Stabling', 'Add-ons & stabling', {
      label: addOn.name,
      qty: totals.qty,
      revenue: totals.revenue,
    });
  }

  const vendorQty = new Map<string, number>();
  for (const booking of bookings.data) {
    if (booking.status !== SETTLED_BOOKING_STATUS || !booking.paid_at) continue;
    for (const item of booking.vendor_booking_items) {
      vendorQty.set(
        item.vendor_item_id,
        (vendorQty.get(item.vendor_item_id) ?? 0) + (item.qty ?? 0),
      );
    }
  }
  for (const item of vendorItems.data) {
    const qty = vendorQty.get(item.id) ?? 0;
    push('Vendor Items', 'Vendor items', {
      label: item.name,
      qty,
      revenue: qty * (item.price ?? 0),
    });
  }

  const merchTotals = new Map<string, { qty: number; revenue: number }>();
  for (const sale of merchSales.data) {
    const items = (sale.items ?? []) as { merchItemId?: string; qty?: number; amount?: number }[];
    for (const item of items) {
      if (!item.merchItemId) continue;
      const current = merchTotals.get(item.merchItemId) ?? { qty: 0, revenue: 0 };
      merchTotals.set(item.merchItemId, {
        qty: current.qty + (item.qty ?? 0),
        revenue: current.revenue + (item.amount ?? 0),
      });
    }
  }
  const merchItems = (show.data.merch_items ?? []) as { id: string; name: string }[];
  for (const item of merchItems) {
    const totals = merchTotals.get(item.id) ?? { qty: 0, revenue: 0 };
    push('Merchandise', 'Merchandise', {
      label: item.name,
      qty: totals.qty,
      revenue: totals.revenue,
    });
  }

  const ordered: PnlCategory[] = PNL_CATEGORY_ORDER.filter((name) => categories.has(name)).map(
    (name) => {
      const subs = [...(categories.get(name) ?? new Map<string, PnlLineItem[]>())]
        .map(([subName, items]) => ({
          name: subName,
          items: [...items].sort((a, b) => b.revenue - a.revenue),
          subtotal: items.reduce((sum, i) => sum + i.revenue, 0),
        }))
        .sort((a, b) => b.subtotal - a.subtotal);

      return {
        name,
        subs,
        subtotal: subs.reduce((sum, s) => sum + s.subtotal, 0),
      };
    },
  );

  const breakdownTotal = ordered.reduce((sum, c) => sum + c.subtotal, 0);

  // Revenue is what was collected and kept — refunds netted out, additional
  // charges added in. Reading the raw `status` column alone counted refunded
  // money as revenue, because a refund never changes that column.
  const revenueTotal =
    orders.data.reduce(
      (sum, o) =>
        o.status === SETTLED_ORDER_STATUS
          ? sum +
            netCollected({
              amountTotal: o.amount_total,
              additionalChargesTotal: o.additional_charges_total,
              refundedAmount: o.refunded_amount,
              additionalRefundedTotal: additionalRefundedTotal(o.additional_charges),
            })
          : sum,
      0,
    ) +
    bookings.data.reduce(
      (sum, b) =>
        b.status === SETTLED_BOOKING_STATUS && b.paid_at
          ? sum +
            netCollected({
              amountTotal: b.amount_total,
              additionalChargesTotal: b.additional_charges_total,
              refundedAmount: b.refunded_amount,
              additionalRefundedTotal: additionalRefundedTotal(b.additional_charges),
            })
          : sum,
      0,
    ) +
    merchSales.data.reduce((sum, m) => sum + m.total, 0);

  const stored = show.data.expenses as unknown as ShowExpense[] | null;
  const expenses =
    stored ??
    DEFAULT_SHOW_EXPENSES.map((label, index) => ({
      id: `default-${String(index)}`,
      label,
      amount: 0,
    }));
  const expensesTotal = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return {
    showId: show.data.id,
    showName: show.data.name,
    categories: ordered,
    revenueTotal,
    breakdownTotal,
    expenses,
    expensesTotal,
    net: revenueTotal - expensesTotal,
  };
}

function showDayIndex(startDate: string | null, date: string | null): number | null {
  if (!startDate || !date) return null;
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const day = Date.parse(`${date.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(day)) return null;
  const index = Math.round((day - start) / 86_400_000);
  return index >= 0 ? index : null;
}

export async function getMasterSchedule(showId: string): Promise<MasterScheduleData | null> {
  const supabase = await createServerClient();

  const { data: show, error: showError } = await supabase
    .from('shows')
    .select(
      'id, name, start_date, timezone, locations, schedule_prefs, day_start_times, day_end_times, runner_state',
    )
    .eq('id', showId)
    .maybeSingle();
  if (showError) throw showError;
  if (!show) return null;

  const { data: classes, error: classError } = await supabase
    .from('classes')
    .select('id, label, display_name, event, location, date, min_per_ride, run_order')
    .eq('show_id', showId)
    .order('label');
  if (classError) throw classError;

  const classIds = classes.map((c) => c.id);
  let entries: {
    id: string;
    class_id: string;
    num: string;
    rider: string | null;
    horse: string | null;
    horse_id: string | null;
    status: string | null;
    ride_order: number;
    final_pct: string | null;
  }[] = [];

  // One read serves both the running order and the scored percentages.
  if (classIds.length > 0) {
    entries = await fetchAllRows(() =>
      supabase
        .from('class_entries')
        .select('id, class_id, num, rider, horse, horse_id, status, ride_order, final_pct')
        .in('class_id', classIds)
        .order('ride_order')
        .order('id'),
    );
  }

  const byClass = new Map<string, ScheduleEntry[]>();
  for (const entry of entries) {
    const list = byClass.get(entry.class_id) ?? [];
    list.push({
      entryId: entry.id,
      num: entry.num,
      name: entry.rider ?? '',
      horse: entry.horse ?? '',
      horseId: entry.horse_id,

      division: 'O',
      quals: [],
      status: entry.status ?? 'scheduled',
    });
    byClass.set(entry.class_id, list);
  }

  const panel =
    classIds.length > 0
      ? await supabase
          .from('class_panel')
          .select('class_id, position, staff_assignments!class_panel_judge_staff_id_fkey(name)')
          .in('class_id', classIds)
      : { data: [], error: null };
  if (panel.error) throw panel.error;

  const judgesByClass = new Map<string, string[]>();
  for (const seat of panel.data) {
    const staff = seat.staff_assignments as { name?: string } | null;
    if (!staff?.name) continue;
    const list = judgesByClass.get(seat.class_id) ?? [];
    list.push(seat.position ? `${staff.name} (${seat.position})` : staff.name);
    judgesByClass.set(seat.class_id, list);
  }

  const finalPctByEntry = new Map<string, string>();
  for (const row of entries) {
    if (row.final_pct) finalPctByEntry.set(row.id, row.final_pct);
  }

  const rings = ((show.locations ?? []) as unknown as RingRow[]).map((ring) => ({
    name: ring.name,
    size: ring.size,

    start: '08:00',
  }));

  const prefs = {
    ...DEFAULT_SCHEDULE_PREFS,
    ...((show.schedule_prefs ?? {}) as Partial<SchedulePrefs>),
  };
  const dayStartTimes = (show.day_start_times ?? []) as unknown as string[];
  const dayEndTimes = (show.day_end_times ?? []) as unknown as string[];

  const schedule = buildMasterSchedule(
    classes
      .filter((c) => (byClass.get(c.id) ?? []).length > 0)
      .map((c) => ({
        cls: c.id,
        label: c.display_name ?? c.label,

        discipline: c.event ?? '',
        ring: c.location,
        // moveClassToRingDay pins a class by writing its calendar date;
        // turn that back into the 0-based show day the engine expects.
        pinnedDay: showDayIndex(show.start_date, c.date),
        minPerRide: c.min_per_ride,
        runOrder: c.run_order,
        order: byClass.get(c.id) ?? [],
      })),
    {
      ...prefs,

      lunchAt: '12:00',
      lunchDur: 60,
      dayStartTimes,
      dayEndTimes,
    },
    rings.length > 0 ? rings : [{ name: 'Ring 1', size: 'standard', start: '08:00' }],
  );

  return {
    showId: show.id,
    showName: show.name,
    startDate: show.start_date,
    timezone: show.timezone,
    schedule,
    rings: rings.map((r) => r.name),
    judgesByClass: Object.fromEntries(judgesByClass),
    finalPctByEntry: Object.fromEntries(finalPctByEntry),
    rules: {
      hardRuleEnabled: prefs.hardRuleEnabled,
      hardRuleSameHorseMin: prefs.hardRuleSameHorseMin,
      hardRuleDiffHorseMin: prefs.hardRuleDiffHorseMin,
      awardsByDivision: prefs.awardsByDivision,
    },
    published: ((show.runner_state ?? {}) as { approved?: boolean }).approved === true,

    rideMinutesByClass: Object.fromEntries(
      classes.map((c) => [
        c.id,
        c.min_per_ride ??
          prefs.perMin + prefs.buffer + (UPPER_LEVELS.has(c.event ?? '') ? prefs.upper : 0),
      ]),
    ),
  };
}

export async function getShowAwards(
  showId: string,
  discipline: string,
): Promise<ShowAwards | null> {
  const supabase = await createServerClient();

  const { data: show, error: showError } = await supabase
    .from('shows')
    .select('id, name, start_date, end_date, venue_name, schedule_prefs')
    .eq('id', showId)
    .maybeSingle();
  if (showError) throw showError;
  if (!show) return null;

  const prefs = {
    ...DEFAULT_SCHEDULE_PREFS,
    ...((show.schedule_prefs ?? {}) as Partial<SchedulePrefs>),
  };

  const { data: classes, error: classError } = await supabase
    .from('classes')
    .select('id, label, award_scope, division, group_name, ribbon_places, ribbon_colors')
    .eq('show_id', showId)
    .order('label');
  if (classError) throw classError;

  const classIds = classes.map((c) => c.id);
  let entries: {
    class_id: string;
    num: string;
    rider: string | null;
    horse: string | null;
    final_pct: string | null;
    collective_total: number | null;
    division: string;
    test_override: unknown;
  }[] = [];

  if (classIds.length > 0) {
    entries = await fetchAllRows(() =>
      supabase
        .from('class_entries')
        .select('class_id, num, rider, horse, final_pct, collective_total, division, test_override')
        .in('class_id', classIds)
        .order('id'),
    );
  }

  const classTestNameById = new Map<string, string>();
  if (classIds.length > 0) {
    const { data: classTests, error: classTestsError } = await supabase
      .from('class_tests')
      .select('class_id, name')
      .in('class_id', classIds);
    if (classTestsError) throw classTestsError;
    for (const row of classTests) classTestNameById.set(row.class_id, row.name);
  }

  const testTally: Record<string, number> = {};
  for (const entry of entries) {
    const override =
      entry.test_override && typeof entry.test_override === 'object'
        ? (entry.test_override as Record<string, unknown>)
        : null;
    const overrideName = typeof override?.name === 'string' ? override.name : null;
    const testName = overrideName ?? classTestNameById.get(entry.class_id) ?? 'No test assigned';
    testTally[testName] = (testTally[testName] ?? 0) + 1;
  }
  const testTotal = Object.values(testTally).reduce((sum, n) => sum + n, 0);

  const byClass = new Map<string, AwardEntry[]>();
  for (const entry of entries) {
    const list = byClass.get(entry.class_id) ?? [];
    list.push({
      num: entry.num,
      name: entry.rider ?? '',
      horse: entry.horse ?? '',

      pct: parseFinalPct(entry.final_pct),
      ctot: entry.collective_total,
      division: entry.division,
    });
    byClass.set(entry.class_id, list);
  }

  const shaped: AwardClassInput[] = classes.map((c) => ({
    id: c.id,
    label: c.label,
    awardScope: c.award_scope,
    division: c.division,
    groupName: c.group_name,

    ribbonPlaces: c.ribbon_places ?? 6,
    ribbonColors: (c.ribbon_colors as RibbonColor[] | null) ?? null,
    entries: byClass.get(c.id) ?? [],
  }));

  const disciplines = [...new Set(shaped.map((c) => disciplineOf(c.label)))];
  const filtered =
    discipline === 'all' ? shaped : shaped.filter((c) => disciplineOf(c.label) === discipline);

  const report = buildAwardsReport(filtered, prefs.awardsByDivision);
  const printReport =
    filtered === shaped ? report : buildAwardsReport(shaped, prefs.awardsByDivision);

  const totalOf = (r: AwardsReport) => Object.values(r.tally).reduce((sum, n) => sum + n, 0);

  return {
    showId: show.id,
    showName: show.name,
    dates: [show.start_date, show.end_date].filter(Boolean).join(' – '),
    venue: show.venue_name ?? '',
    disciplines,
    hasClasses: filtered.length > 0,
    report,
    printReport,
    awardsByDivision: prefs.awardsByDivision,
    ribbonTotal: totalOf(report),
    printRibbonTotal: printReport === report ? totalOf(report) : totalOf(printReport),
    testTally,
    testTotal,
  };
}

interface HorseDocumentUpload {
  label?: string;
  verified?: boolean;
  expirationDate?: string;
}

/* Documents live on the horse (horses.document_uploads), not the show, so
 * they're already cross-show data — what's missing is an organizer-facing
 * view that surfaces that history instead of only what was uploaded for the
 * show currently being looked at. This fetches, for every rider on this
 * show's roster: every document on every horse they've ever entered (any
 * show), and the names of the organization's other shows they've competed
 * in before, then attaches both to the matching row in `byNum` in place. */
async function attachRiderDocumentHistory({
  byNum,
  riderIdsByNum,
  horseIdsByNum,
  orgId,
  currentShowId,
}: {
  byNum: Map<string, RiderListRow>;
  riderIdsByNum: Map<string, Set<string>>;
  horseIdsByNum: Map<string, Set<string>>;
  orgId: string | null;
  currentShowId: string;
}): Promise<void> {
  const allHorseIds = [...new Set([...horseIdsByNum.values()].flatMap((set) => [...set]))];
  const allRiderIds = [...new Set([...riderIdsByNum.values()].flatMap((set) => [...set]))];
  if (allHorseIds.length === 0 && allRiderIds.length === 0) return;

  const supabase = await createServerClient();

  const horsesById = new Map<string, { name: string; document_uploads: unknown }>();
  if (allHorseIds.length > 0) {
    const { data, error } = await supabase
      .from('horses')
      .select('id, name, document_uploads')
      .in('id', allHorseIds);
    if (error) throw error;
    for (const h of data) horsesById.set(h.id, h);
  }

  const pastShowNamesByRider = new Map<string, Set<string>>();
  if (allRiderIds.length > 0 && orgId) {
    const pastEntries = await fetchAllRows(() =>
      supabase
        .from('class_entries')
        .select('rider_id, class_id')
        .in('rider_id', allRiderIds)
        .order('id'),
    );

    const pastClassIds = [...new Set(pastEntries.map((e) => e.class_id))];
    const { data: pastClasses, error: classesError } =
      pastClassIds.length > 0
        ? await supabase.from('classes').select('id, show_id').in('id', pastClassIds)
        : { data: [], error: null };
    if (classesError) throw classesError;
    const showIdByClassId = new Map(pastClasses.map((c) => [c.id, c.show_id]));

    const pastShowIds = [...new Set(pastClasses.map((c) => c.show_id))].filter(
      (id) => id !== currentShowId,
    );
    const { data: pastShows, error: showsError } =
      pastShowIds.length > 0
        ? await supabase.from('shows').select('id, name').eq('org_id', orgId).in('id', pastShowIds)
        : { data: [], error: null };
    if (showsError) throw showsError;
    const showById = new Map(pastShows.map((s) => [s.id, s.name]));

    for (const entry of pastEntries) {
      if (!entry.rider_id) continue;
      const showId = showIdByClassId.get(entry.class_id);
      const showName = showId ? showById.get(showId) : undefined;
      if (!showName) continue;
      const set = pastShowNamesByRider.get(entry.rider_id) ?? new Set<string>();
      set.add(showName);
      pastShowNamesByRider.set(entry.rider_id, set);
    }
  }

  for (const [num, row] of byNum) {
    const documents: RiderDocumentInfo[] = [];
    for (const horseId of horseIdsByNum.get(num) ?? []) {
      const horse = horsesById.get(horseId);
      if (!horse) continue;
      const uploads = (horse.document_uploads ?? []) as HorseDocumentUpload[];
      for (const upload of uploads) {
        documents.push({
          horseName: horse.name,
          label: upload.label ?? 'Document',
          verified: upload.verified ?? false,
          expirationDate: upload.expirationDate ?? null,
        });
      }
    }
    row.documents = documents;

    const pastShows = new Set<string>();
    for (const riderId of riderIdsByNum.get(num) ?? []) {
      for (const name of pastShowNamesByRider.get(riderId) ?? []) pastShows.add(name);
    }
    row.pastShows = [...pastShows].sort((a, b) => a.localeCompare(b));
  }
}

export async function getShowRiders(showId: string): Promise<ShowRiders | null> {
  const supabase = await createServerClient();

  const { data: show, error: showError } = await supabase
    .from('shows')
    .select('id, name, start_date, org_id')
    .eq('id', showId)
    .maybeSingle();
  if (showError) throw showError;
  if (!show) return null;

  const { data: classes, error: classError } = await supabase
    .from('classes')
    .select('id, label, display_name, fee')
    .eq('show_id', showId);
  if (classError) throw classError;

  const classById = new Map(classes.map((c) => [c.id, c]));
  const classIds = classes.map((c) => c.id);

  let entries: {
    class_id: string;
    num: string;
    rider: string | null;
    horse: string | null;
    rider_id: string | null;
    horse_id: string | null;
    order_id: string | null;
    status: string | null;
  }[] = [];
  if (classIds.length > 0) {
    entries = await fetchAllRows(() =>
      supabase
        .from('class_entries')
        .select('class_id, num, rider, horse, rider_id, horse_id, order_id, status')
        .in('class_id', classIds)
        .order('id'),
    );
  }

  const orderIds = [...new Set(entries.map((e) => e.order_id).filter((id): id is string => !!id))];
  const ordersById = new Map<string, { status: string; amount: number; refunded: number }>();
  if (orderIds.length > 0) {
    const { data, error } = await supabase
      .from('orders')
      .select('id, status, amount_total, refunded_amount')
      .in('id', orderIds);
    if (error) throw error;
    for (const o of data) {
      ordersById.set(o.id, {
        status: o.status ?? 'pending',
        amount: o.amount_total,
        refunded: o.refunded_amount ?? 0,
      });
    }
  }
  const orderIdsByNum = new Map<string, Set<string>>();
  const unorderedFeeByNum = new Map<string, number>();

  const riderIdsByNum = new Map<string, Set<string>>();
  const horseIdsByNum = new Map<string, Set<string>>();
  const byNum = new Map<string, RiderListRow>();
  for (const entry of entries) {
    const cls = classById.get(entry.class_id);
    const row = byNum.get(entry.num) ?? {
      num: entry.num,
      name: entry.rider ?? '',
      horse: entry.horse ?? '',
      classes: [],
      total: 0,
      documents: [],
      pastShows: [],
      horses: [],
      classCodes: [],
      payment: 'pending' as const,
      outstanding: 0,
      refunded: 0,
    };
    const scratched = entry.status === 'scratched';
    if (cls) {
      row.classes.push(cls.display_name ?? cls.label);
      row.classCodes.push({ code: rideTestCode(cls.label), scratched });
      if (!scratched) row.total += cls.fee ?? 0;
      if (!entry.order_id && !scratched) {
        unorderedFeeByNum.set(entry.num, (unorderedFeeByNum.get(entry.num) ?? 0) + (cls.fee ?? 0));
      }
    }
    if (entry.horse && !row.horses.includes(entry.horse)) row.horses.push(entry.horse);
    if (entry.order_id) {
      const set = orderIdsByNum.get(entry.num) ?? new Set<string>();
      set.add(entry.order_id);
      orderIdsByNum.set(entry.num, set);
    }
    byNum.set(entry.num, row);
    if (entry.rider_id) {
      const set = riderIdsByNum.get(entry.num) ?? new Set<string>();
      set.add(entry.rider_id);
      riderIdsByNum.set(entry.num, set);
    }
    if (entry.horse_id) {
      const set = horseIdsByNum.get(entry.num) ?? new Set<string>();
      set.add(entry.horse_id);
      horseIdsByNum.set(entry.num, set);
    }
  }

  for (const [num, row] of byNum) {
    const orders = [...(orderIdsByNum.get(num) ?? [])]
      .map((id) => ordersById.get(id))
      .filter((o): o is NonNullable<typeof o> => !!o);
    const unpaidOrders = orders
      .filter((o) => o.status !== 'paid')
      .reduce((sum, o) => sum + o.amount, 0);
    row.refunded = orders.reduce((sum, o) => sum + o.refunded, 0);
    row.outstanding = unpaidOrders + (unorderedFeeByNum.get(num) ?? 0);
    row.payment =
      row.classCodes.length > 0 && row.classCodes.every((c) => c.scratched)
        ? 'scratched'
        : row.outstanding > 0
          ? 'pending'
          : 'paid';
  }

  await attachRiderDocumentHistory({
    byNum,
    riderIdsByNum,
    horseIdsByNum,
    orgId: show.org_id,
    currentShowId: showId,
  });

  const schedule = await getMasterSchedule(showId);
  const onSiteByDay: Record<number, string[]> = {};
  let totalDays = 0;

  for (const arena of schedule?.schedule.arenas ?? []) {
    for (const item of arena.items) {
      if (item.type !== 'ride') continue;
      totalDays = Math.max(totalDays, item.day + 1);
      const list = onSiteByDay[item.day] ?? [];
      if (!list.includes(item.num)) list.push(item.num);
      onSiteByDay[item.day] = list;
    }
  }

  return {
    showId: show.id,
    showName: show.name,
    startDate: show.start_date,
    riders: [...byNum.values()].sort((a, b) => a.name.localeCompare(b.name)),
    onSiteByDay,
    totalDays,
  };
}

export async function getShowEntries(showId: string): Promise<ShowEntries | null> {
  const supabase = await createServerClient();

  const { data: show, error: showError } = await supabase
    .from('shows')
    .select('id, name')
    .eq('id', showId)
    .maybeSingle();
  if (showError) throw showError;
  if (!show) return null;

  const { data: classes, error: classError } = await supabase
    .from('classes')
    .select('id, label, display_name, fee')
    .eq('show_id', showId);
  if (classError) throw classError;

  const classById = new Map(classes.map((c) => [c.id, c]));
  const classIds = classes.map((c) => c.id);

  let rows: { class_id: string; num: string; rider: string | null; horse: string | null }[] = [];
  if (classIds.length > 0) {
    rows = await fetchAllRows(() =>
      supabase
        .from('class_entries')
        .select('class_id, num, rider, horse')
        .in('class_id', classIds)
        .order('id'),
    );
  }

  const entries: EntryListRow[] = [];
  for (const row of rows) {
    const cls = classById.get(row.class_id);
    if (!cls) continue;
    entries.push({
      cls: cls.display_name ?? cls.label,
      fee: cls.fee ?? 0,
      rider: row.rider ?? '',
      num: row.num,
      horse: row.horse ?? '',
    });
  }

  entries.sort((a, b) => a.cls.localeCompare(b.cls) || a.rider.localeCompare(b.rider));

  return {
    showId: show.id,
    showName: show.name,
    entries,
    classes: [...new Set(entries.map((e) => e.cls))].sort((a, b) => a.localeCompare(b)),
  };
}
