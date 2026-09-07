import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import {
  DEFAULT_SHOW_EXPENSES,
  PNL_CATEGORY_ORDER,
  DEFAULT_SCHEDULE_PREFS,
  UPPER_LEVELS,
  type RibbonColor,
} from '@/modules/shows/constants';
import {
  buildMasterSchedule,
  type MasterSchedule,
  type ScheduleEntry,
} from '@/modules/shows/schedule-engine';
import {
  buildAwardsReport,
  disciplineOf,
  type AwardClassInput,
  type AwardEntry,
  type AwardsReport,
} from '@/modules/shows/awards-engine';
import { calcPlatformFee } from '@/shared/lib/fees';
import {
  netCollected,
  SETTLED_ORDER_STATUS,
  SETTLED_BOOKING_STATUS,
} from '@/shared/lib/sales-math';

export interface ClassRow {
  id: string;
  label: string;
  displayName: string | null;
  division: string | null;
  location: string | null;
  fee: number;
  judgesCount: number;
  date: string | null;
  time: string | null;
  entryCount: number;
  scoringOpen: boolean;
  resultsPublished: boolean;
  ribbonPlaces: number;
  awardScope: string;
  runOrder: number | null;
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

  const { data: entries, error: entryError } = await supabase
    .from('class_entries')
    .select('class_id')
    .in(
      'class_id',
      data.map((c) => c.id),
    );
  if (entryError) throw entryError;

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

export interface DivisionRow {
  id: string;
  name: string;
  position: number;
  classCount: number;
}

export async function listDivisions(showId: string): Promise<DivisionRow[]> {
  const supabase = await createServerClient();

  const [divisions, classes] = await Promise.all([
    supabase.from('divisions').select('id, name, position').eq('show_id', showId).order('position'),
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
  }));
}

export interface StaffRow {
  id: string;
  name: string;
  role: string;
  email: string | null;
  phone: string | null;
  status: string;
  isSteward: boolean;
  accepted: boolean;
  canViewMoney: boolean;
  canScratchSkipDq: boolean;
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

export interface CatalogItem {
  id: string;
  name: string;
  price: number;
  enabled: boolean;
  qty: number | null;
}

export interface SalesCatalog {
  addOns: CatalogItem[];
  qualTypes: CatalogItem[];
  vendorItems: CatalogItem[];
  merchItems: { id: string; name: string; price: number }[];
  merchEnabled: boolean;
  merchSalesTotal: number;
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

export interface ShowDocumentRow {
  id: string;
  name: string;

  url: string | null;
  path: string;
  eventIds: string[];
  createdAt: string;
}

export async function listShowDocuments(showId: string): Promise<ShowDocumentRow[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('documents')
    .select('id, name, path, url, event_ids, created_at')
    .eq('show_id', showId)
    .order('name');
  if (error) throw error;

  return Promise.all(
    data.map(async (d) => {
      let url = d.url;
      if (!url && d.path) {
        const { data: signed } = await supabase.storage
          .from('documents')
          .createSignedUrl(d.path, 3600);
        url = signed?.signedUrl ?? null;
      }
      return {
        id: d.id,
        name: d.name,
        url,
        path: d.path,
        eventIds: (d.event_ids ?? []) as unknown as string[],
        createdAt: d.created_at,
      };
    }),
  );
}

export interface DocumentsPageData {
  showId: string;
  showName: string;
  documents: ShowDocumentRow[];
  classes: { id: string; label: string }[];
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

export interface DocumentRequirement {
  id: string;
  label: string;
  requiresExpiration?: boolean;
  requiresApproval?: boolean;
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

export interface RingRow {
  name: string;
  size: 'standard' | 'small';
}

export interface SchedulePrefs {
  perMin: number;
  buffer: number;
  upper: number;
  end: string;
  order: 'low' | 'high' | 'custom';
  warmup: 'yes' | 'no';
  lunch: boolean;
  extraBreaks: number;
  extraBreakMin: number;

  hardRuleEnabled: boolean;
  hardRuleSameHorseMin: number;
  hardRuleDiffHorseMin: number;

  awardsByDivision: boolean;
}

export interface MerchItem {
  id: string;
  name: string;
  price: number;
}

export interface ShowSetupDetail {
  id: string;
  orgId: string;
  name: string;
  org: string | null;
  showType: 'rated' | 'schooling';
  startDate: string | null;
  endDate: string | null;
  timezone: string | null;
  startingRiderNumber: number;
  governingBodies: string[];
  venueId: string | null;
  venueName: string | null;
  locations: RingRow[];
  schedulePrefs: SchedulePrefs;

  dayStartTimes: string[];
  dayEndTimes: string[];
  website: string | null;
  phone: string | null;
  contactEmail: string | null;
  prizeListUrl: string | null;
  documentRequirements: DocumentRequirement[];
  merchandiseEnabled: boolean;
  merchItems: MerchItem[];
  waiverText: string | null;
  waiverApprovedText: string | null;
}

export async function getShowSetupDetail(showId: string): Promise<ShowSetupDetail | null> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('shows')
    .select(
      'id, org_id, name, show_details, show_type, start_date, end_date, timezone, starting_rider_number, governing_bodies, venue_id, venue_name, locations, schedule_prefs, day_start_times, day_end_times, document_requirements, merchandise_enabled, merch_items, waiver_text, waiver_approved_text',
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
    orgId: data.org_id,
    name: data.name,
    org: showDetails.org ?? null,
    showType: (data.show_type as 'rated' | 'schooling' | null) ?? 'rated',
    startDate: data.start_date,
    endDate: data.end_date,
    timezone: data.timezone,
    startingRiderNumber: data.starting_rider_number ?? 101,
    governingBodies: (data.governing_bodies ?? []) as string[],
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
  };
}

export interface VenueOption {
  id: string;
  name: string;
  rings: RingRow[];
}

export async function listVenuesForOrg(orgId: string): Promise<VenueOption[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('venues')
    .select('id, name, rings')
    .eq('org_id', orgId)
    .order('name');
  if (error) throw error;

  return data.map((v) => ({
    id: v.id,
    name: v.name,
    rings: (v.rings ?? []) as unknown as RingRow[],
  }));
}

export interface CompletenessSection {
  name: string;
  ok: boolean;
  items: { label: string; ok: boolean }[];
}

export interface ShowCompleteness {
  sections: CompletenessSection[];

  complete: boolean;
}

export async function getShowCompleteness(showId: string): Promise<ShowCompleteness> {
  const supabase = await createServerClient();

  const [show, divisions, classes, docs, staff, catalog] = await Promise.all([
    supabase
      .from('shows')
      .select(
        'name, start_date, end_date, timezone, locations, waiver_text, waiver_approved_text, show_details, show_type, governing_bodies',
      )
      .eq('id', showId)
      .single(),
    listDivisions(showId),
    listClasses(showId),
    getDocumentRequirements(showId),
    listStaff(showId),
    getSalesCatalog(showId),
  ]);
  if (show.error) throw show.error;

  const locations = (show.data.locations ?? []) as unknown as RingRow[];
  const waiverApproved =
    !!show.data.waiver_approved_text && show.data.waiver_approved_text === show.data.waiver_text;

  const org = ((show.data.show_details ?? {}) as { org?: string }).org ?? '';
  const governingBodies = (show.data.governing_bodies ?? []) as unknown as string[];

  const governingBodiesOk = show.data.show_type !== 'rated' || governingBodies.length > 0;

  const sections: CompletenessSection[] = [
    {
      name: 'Show Details',
      items: [
        { label: 'Show name', ok: !!show.data.name },
        { label: 'Organization / club name', ok: !!org },
        { label: 'Start date', ok: !!show.data.start_date },
        { label: 'End date', ok: !!show.data.end_date },
        { label: 'Time zone', ok: !!show.data.timezone },
        { label: 'Governing bodies', ok: governingBodiesOk },
      ],
      ok:
        !!show.data.name &&
        !!org &&
        !!show.data.start_date &&
        !!show.data.end_date &&
        !!show.data.timezone &&
        governingBodiesOk,
    },
    {
      name: 'Venue',
      items: [{ label: 'At least one ring/arena', ok: locations.length > 0 }],
      ok: locations.length > 0,
    },
    {
      name: 'Class Divisions',
      items: [{ label: 'At least one division', ok: divisions.length > 0 }],
      ok: divisions.length > 0,
    },
    {
      name: 'Select Events',
      items: [{ label: 'At least one class open for entry', ok: classes.length > 0 }],
      ok: classes.length > 0,
    },
    {
      name: 'Required Documents',
      items: [{ label: 'At least one requirement listed', ok: docs.length > 0 }],
      ok: docs.length > 0,
    },
    {
      name: 'Merchandise Sales',
      items: [{ label: 'Storefront turned on', ok: catalog.merchEnabled }],
      ok: catalog.merchEnabled,
    },
    {
      name: 'Staffing',
      items: [{ label: 'At least one staff member assigned', ok: staff.length > 0 }],
      ok: staff.length > 0,
    },
    {
      name: 'Waiver of Liability',
      items: [{ label: 'Approved, matching the current text', ok: waiverApproved }],
      ok: waiverApproved,
    },
  ];

  return { sections, complete: sections.every((s) => s.ok) };
}

export interface ShowBilling {
  settledRevenue: number;
  paidOrders: number;
  entryValue: number;
  vendorRevenue: number;
  merchRevenue: number;
  expenses: { id: string; label: string; amount: number }[];
  expenseTotal: number;
}

export async function getShowBilling(showId: string): Promise<ShowBilling> {
  const supabase = await createServerClient();

  const [orders, show, merch, vendors, classes] = await Promise.all([
    supabase
      .from('orders')
      .select('amount_total, additional_charges_total, refunded_amount')
      .eq('show_id', showId)
      .eq('status', SETTLED_ORDER_STATUS),
    supabase.from('shows').select('expenses').eq('id', showId).single(),
    supabase.from('merch_sales').select('total').eq('show_id', showId),
    supabase
      .from('vendor_bookings')
      .select('amount_total, additional_charges_total, refunded_amount')
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
    const { data: entries, error: entryError } = await supabase
      .from('class_entries')
      .select('class_id')
      .in(
        'class_id',
        classes.data.map((c) => c.id),
      );
    if (entryError) throw entryError;
    entryValue = entries.reduce((sum, e) => sum + (feeByClass.get(e.class_id) ?? 0), 0);
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
        }),
      0,
    ),
    merchRevenue: merch.data.reduce((sum, m) => sum + m.total, 0),
    expenses,
    expenseTotal: expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
  };
}

export interface SelectEventsData {
  showId: string;
  showName: string;
  ticketOpen: string;
  ticketCloseDate: string;
  ticketCloseTime: string;

  ringNames: string[];

  classes: {
    id: string;
    label: string;
    division: string | null;
    fee: number;
    location: string | null;
  }[];
}

export async function getSelectEventsData(showId: string): Promise<SelectEventsData | null> {
  const supabase = await createServerClient();

  const [show, classes] = await Promise.all([
    supabase
      .from('shows')
      .select('id, name, ticket_open, ticket_close, locations')
      .eq('id', showId)
      .maybeSingle(),
    supabase
      .from('classes')
      .select('id, label, division, fee, location')
      .eq('show_id', showId)
      .order('label'),
  ]);
  if (show.error) throw show.error;
  if (!show.data) return null;
  if (classes.error) throw classes.error;

  const [closeDate = '', closeTime = ''] = (show.data.ticket_close ?? '').split(' ');
  const rings = (show.data.locations ?? []) as unknown as RingRow[];

  return {
    showId: show.data.id,
    showName: show.data.name,
    ticketOpen: show.data.ticket_open ?? '',
    ticketCloseDate: closeDate,
    ticketCloseTime: closeTime,
    ringNames: rings.map((r) => r.name).filter((n): n is string => !!n),
    classes: classes.data.map((c) => ({
      id: c.id,
      label: c.label,
      division: c.division,
      fee: c.fee ?? 0,
      location: c.location,
    })),
  };
}

export interface CatalogListItem {
  id: string;
  name: string;
  price: number;
}

export interface VendorSpaceItem extends CatalogListItem {
  qty: number | null;
}

export interface RiderEntriesData {
  showId: string;
  showName: string;
  published: boolean;

  notPublishedReason: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;

  vendorMapUrl: string | null;
  addOns: CatalogListItem[];
  vendorSpaces: VendorSpaceItem[];
  qualifications: CatalogListItem[];
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
    supabase.from('add_ons').select('id, name, price').eq('show_id', showId).order('name'),
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
    addOns: addOns.data.map((a) => ({ id: a.id, name: a.name, price: a.price ?? 0 })),
    vendorSpaces: vendorItems.data.map((v) => ({
      id: v.id,
      name: v.name,
      price: v.price ?? 0,
      qty: v.qty,
    })),
    qualifications: qualTypes.data.map((q) => ({ id: q.id, name: q.name, price: q.price ?? 0 })),
  };
}

export interface ScheduleReviewClassRow {
  id: string;
  event: string | null;
  label: string;
  displayName: string | null;
  division: string | null;
  location: string | null;
  arena: string | null;
  judgesCount: number;
  fee: number;
  platformFee: number;
  entryCount: number;
  sponsor: string | null;
}

export interface ScheduleReviewData {
  showId: string;
  showName: string;
  classes: ScheduleReviewClassRow[];
  ringNames: string[];

  feeModel: string;
  totals: {
    classCount: number;
    entryCount: number;
    grossFees: number;
    platformFees: number;
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
  if (classIds.length > 0) {
    const { data: entries, error: entryError } = await supabase
      .from('class_entries')
      .select('class_id')
      .in('class_id', classIds);
    if (entryError) throw entryError;
    counts = new Map();
    for (const entry of entries) {
      counts.set(entry.class_id, (counts.get(entry.class_id) ?? 0) + 1);
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

  const locations = (show.locations ?? []) as unknown as RingRow[];
  const ringNames = locations.map((l) => l.name).filter((name): name is string => !!name);

  const totals = rows.reduce(
    (acc, r) => ({
      classCount: acc.classCount + 1,
      entryCount: acc.entryCount + r.entryCount,
      grossFees: acc.grossFees + r.fee * r.entryCount,
      platformFees: acc.platformFees + r.platformFee * r.entryCount,
    }),
    { classCount: 0, entryCount: 0, grossFees: 0, platformFees: 0 },
  );

  return { showId: show.id, showName: show.name, classes: rows, ringNames, feeModel, totals };
}

export interface TestTemplateMovement {
  num: number;
  text: string;
  coef: number;
}

export interface TestTemplateCollective {
  key: string;
  label: string;
  coef: number;
}

/* Score-sheet engine (phase 1) read shapes — mirror the jsonb columns added in
   20260818120000_scoring_template_structure.sql. */
export interface TemplateInstruction {
  id: string;
  marker: string;
  instruction: string;
  gait: string;
  direction: string;
}
export interface TemplateItem {
  id: string;
  label: string;
  directive: string;
  maxScore: number;
  coef: number;
  required: boolean;
  instructions: TemplateInstruction[];
}
export interface TemplateSection {
  id: string;
  name: string;
  type: string;
  subtotal: boolean;
  items: TemplateItem[];
}
export interface TemplatePenalty {
  id: string;
  name: string;
  penaltyType: string;
  value: string;
  repeat: boolean;
  elimination: boolean;
}
export interface TemplateScoringConfig {
  scoreType: string;
  applyCoefficients: boolean;
  finalDisplay: string;
  formula: string;
}

export interface TestTemplateRow {
  id: string;
  name: string;
  level: string | null;
  sourceLabel: string | null;
  movements: TestTemplateMovement[];
  collectives: TestTemplateCollective[];
  updatedAt: string;
  // Score-sheet engine (phase 1) — the structured fields.
  discipline: string | null;
  sheetType: string | null;
  governingBody: string | null;
  versionYear: string | null;
  arenaSize: string | null;
  rideTime: string | null;
  scoringMethod: string | null;
  maxPoints: number | null;
  sections: TemplateSection[];
  penalties: TemplatePenalty[];
  scoringConfig: TemplateScoringConfig | null;
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

export interface TestBuilderClassOption {
  id: string;
  label: string;
}

export interface TestBuilderPageData {
  showId: string;
  showName: string;
  orgId: string;
  templates: TestTemplateRow[];

  classes: TestBuilderClassOption[];
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

  const [templates, classesRes] = await Promise.all([
    listTestTemplates(show.data.org_id),
    supabase.from('classes').select('id, label').eq('show_id', showId).order('label'),
  ]);
  if (classesRes.error) throw classesRes.error;

  return {
    showId: show.data.id,
    showName: show.data.name,
    orgId: show.data.org_id,
    templates,
    classes: classesRes.data,
  };
}

export interface PnlLineItem {
  label: string;
  qty: number;
  revenue: number;
}

export interface PnlSubcategory {
  name: string;
  subtotal: number;
  items: PnlLineItem[];
}

export interface PnlCategory {
  name: string;
  subtotal: number;
  subs: PnlSubcategory[];
}

export interface ShowExpense {
  id: string;
  label: string;
  amount: number;
}

export interface ShowPnl {
  showId: string;
  showName: string;
  categories: PnlCategory[];

  revenueTotal: number;

  breakdownTotal: number;
  expenses: ShowExpense[];
  expensesTotal: number;
  net: number;
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
        .select('id, status, items, amount_total, additional_charges_total, refunded_amount')
        .eq('show_id', showId),
      supabase.from('add_ons').select('id, name').eq('show_id', showId),
      supabase.from('vendor_items').select('id, name, price').eq('show_id', showId),
      supabase
        .from('vendor_bookings')
        .select(
          'id, status, paid_at, amount_total, additional_charges_total, refunded_amount, vendor_booking_items(vendor_item_id, qty)',
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
    const { data: rows, error: entryError } = await supabase
      .from('class_entries')
      .select('class_id, status, order_id')
      .in('class_id', classIds);
    if (entryError) throw entryError;

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

export interface MasterScheduleData {
  showId: string;
  showName: string;
  startDate: string | null;
  timezone: string | null;
  schedule: MasterSchedule;

  rings: string[];
  judgesByClass: Record<string, string[]>;
  finalPctByEntry: Record<string, string>;
  rules: {
    hardRuleEnabled: boolean;
    hardRuleSameHorseMin: number;
    hardRuleDiffHorseMin: number;
    awardsByDivision: boolean;
  };

  published: boolean;
  rideMinutesByClass: Record<string, number>;
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
  }[] = [];

  if (classIds.length > 0) {
    const { data, error } = await supabase
      .from('class_entries')
      .select('id, class_id, num, rider, horse, horse_id, status, ride_order')
      .in('class_id', classIds)
      .order('ride_order');
    if (error) throw error;
    entries = data;
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

  const [panel, scored] = await Promise.all([
    classIds.length > 0
      ? supabase
          .from('class_panel')
          .select('class_id, position, staff_assignments!class_panel_judge_staff_id_fkey(name)')
          .in('class_id', classIds)
      : Promise.resolve({ data: [], error: null }),
    classIds.length > 0
      ? supabase.from('class_entries').select('id, final_pct').in('class_id', classIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (panel.error) throw panel.error;
  if (scored.error) throw scored.error;

  const judgesByClass = new Map<string, string[]>();
  for (const seat of panel.data) {
    const staff = seat.staff_assignments as { name?: string } | null;
    if (!staff?.name) continue;
    const list = judgesByClass.get(seat.class_id) ?? [];
    list.push(seat.position ? `${staff.name} (${seat.position})` : staff.name);
    judgesByClass.set(seat.class_id, list);
  }

  const finalPctByEntry = new Map<string, string>();
  for (const row of scored.data) {
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
        pinnedDay: null,
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

export interface ShowAwards {
  showId: string;
  showName: string;

  dates: string;
  venue: string;

  disciplines: string[];

  hasClasses: boolean;
  report: AwardsReport;

  printReport: AwardsReport;

  printRibbonTotal: number;

  awardsByDivision: boolean;

  ribbonTotal: number;
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
  }[] = [];

  if (classIds.length > 0) {
    const { data, error } = await supabase
      .from('class_entries')
      .select('class_id, num, rider, horse, final_pct, collective_total, division')
      .in('class_id', classIds);
    if (error) throw error;
    entries = data;
  }

  const byClass = new Map<string, AwardEntry[]>();
  for (const entry of entries) {
    const list = byClass.get(entry.class_id) ?? [];
    list.push({
      num: entry.num,
      name: entry.rider ?? '',
      horse: entry.horse ?? '',

      pct: entry.final_pct == null ? null : Number(entry.final_pct),
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
  };
}

export interface RiderDocumentInfo {
  horseName: string;
  label: string;
  verified: boolean;
  expirationDate: string | null;
}

export interface RiderListRow {
  num: string;
  name: string;
  horse: string;

  classes: string[];

  total: number;

  /* Cross-show tracking: this rider's uploaded horse documents (Coggins,
   * vaccination records, etc.) regardless of which show they were uploaded
   * for — documents belong to the horse, not the show — plus the names of
   * other shows with this same organization this rider has entered before.
   * Both are absent (empty array) rather than missing when there's nothing
   * to show, so the UI never has to special-case undefined. */
  documents: RiderDocumentInfo[];
  pastShows: string[];
}

export interface ShowRiders {
  showId: string;
  showName: string;
  startDate: string | null;
  riders: RiderListRow[];

  onSiteByDay: Record<number, string[]>;
  totalDays: number;
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
    const { data: pastEntries, error: entriesError } = await supabase
      .from('class_entries')
      .select('rider_id, class_id')
      .in('rider_id', allRiderIds);
    if (entriesError) throw entriesError;

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
  }[] = [];
  if (classIds.length > 0) {
    const { data, error } = await supabase
      .from('class_entries')
      .select('class_id, num, rider, horse, rider_id, horse_id')
      .in('class_id', classIds);
    if (error) throw error;
    entries = data;
  }

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
    };
    if (cls) {
      row.classes.push(cls.display_name ?? cls.label);
      row.total += cls.fee ?? 0;
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

export interface EntryListRow {
  cls: string;
  fee: number;
  rider: string;
  num: string;
  horse: string;
}

export interface ShowEntries {
  showId: string;
  showName: string;
  entries: EntryListRow[];
  classes: string[];
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
    const { data, error } = await supabase
      .from('class_entries')
      .select('class_id, num, rider, horse')
      .in('class_id', classIds);
    if (error) throw error;
    rows = data;
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
