import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { calcPlatformFee } from '@/shared/lib/fees';

/**
 * Show-scoped setup reads for the organizer workspace: classes, divisions,
 * staff, documents, the sales catalogs and the billing tab.
 *
 * Kept separate from queries.ts, which covers the dashboard's show list and
 * headline counts. Both are the shows module's data layer; splitting them keeps
 * either file readable.
 */

export interface ClassRow {
  id: string;
  label: string;
  displayName: string | null;
  division: string | null;
  fee: number;
  judgesCount: number;
  date: string | null;
  time: string | null;
  entryCount: number;
  scoringOpen: boolean;
  resultsPublished: boolean;
  ribbonPlaces: number;
  awardScope: string;
}

export async function listClasses(showId: string): Promise<ClassRow[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('classes')
    .select(
      'id, label, display_name, division, fee, judges_count, date, time, scoring_open, results_published, ribbon_places, award_scope'
    )
    .eq('show_id', showId)
    .order('label');
  if (error) throw error;

  if (data.length === 0) return [];

  // Entry counts in one query rather than one per class — the N+1 shape the
  // legacy codebase kept a dedicated regression test for.
  const { data: entries, error: entryError } = await supabase
    .from('class_entries')
    .select('class_id')
    .in(
      'class_id',
      data.map((c) => c.id)
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
    fee: c.fee ?? 0,
    judgesCount: c.judges_count ?? 1,
    date: c.date,
    time: c.time,
    entryCount: counts.get(c.id) ?? 0,
    scoringOpen: c.scoring_open ?? false,
    resultsPublished: c.results_published ?? false,
    ribbonPlaces: c.ribbon_places ?? 6,
    awardScope: c.award_scope,
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
    .select('id, name, role, email, phone, status, is_steward, user_id, can_view_money, can_scratch_skip_dq')
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
    // user_id is set only when the invite is accepted, which is the real signal;
    // `status` tracks the same thing for display but can be edited by hand.
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
    supabase.from('add_ons').select('id, name, price, enabled, qty').eq('show_id', showId).order('name'),
    supabase.from('qual_types').select('id, name, price, enabled').eq('show_id', showId).order('name'),
    supabase.from('vendor_items').select('id, name, price, enabled, qty').eq('show_id', showId).order('name'),
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
  /** Signed for a private bucket read, resolved here so every caller gets a working link without knowing the storage path. */
  url: string | null;
  path: string;
  eventIds: string[];
  createdAt: string;
}

/**
 * The Documents tab's file library — what an organizer publishes to
 * competitors (prize lists, maps, forms), each optionally attached to one or
 * more classes. Distinct from getDocumentRequirements below, which is what
 * riders must upload.
 *
 * `documents` is a private bucket, so `url` is resolved to a signed link at
 * read time (1 hour, matching the vendor-map and catalog-docs precedent)
 * rather than trusting a stored public URL that would 403.
 */
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
        const { data: signed } = await supabase.storage.from('documents').createSignedUrl(d.path, 3600);
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
    })
  );
}

export interface DocumentsPageData {
  showId: string;
  showName: string;
  documents: ShowDocumentRow[];
  classes: { id: string; label: string }[];
}

/** Show Manager, Documents tab: the file library plus the class list its per-doc "attach to" checklist needs. */
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
  // jsonb comes back as the generated Json union, which does not overlap with a
  // specific object shape — the double assertion is the documented way to narrow
  // it. The column's contents are written only by this app.
  return (data.document_requirements ?? []) as unknown as DocumentRequirement[];
}

/* ── Show Manager — Setup tab reads ──────────────────────────────────────
   Backs the Show Details, Venue, and Schedule preferences cards at
   /dashboard/shows/[showId]. See schemas.ts for why these three (of the
   design's eight Setup cards) are the ones built so far. */

export interface RingRow {
  name: string;
  size: 'standard' | 'small';
}

export interface SchedulePrefs {
  perMin: number;
  buffer: number;
  upper: number;
  end: string;
  order: 'low' | 'high';
  warmup: 'yes' | 'no';
  lunch: boolean;
  extraBreaks: number;
  extraBreakMin: number;
}

/** Matches showstaff.html's defaultRules() — the state a show with no schedule_prefs row yet renders as. */
const DEFAULT_SCHEDULE_PREFS: SchedulePrefs = {
  perMin: 9,
  buffer: 2,
  upper: 2,
  end: '17:00',
  order: 'low',
  warmup: 'no',
  lunch: true,
  extraBreaks: 0,
  extraBreakMin: 10,
};

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
  /** One entry per show day, index 0 = first day. '' means "use the show-wide end time above" for that day. */
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
      'id, org_id, name, show_details, show_type, start_date, end_date, timezone, starting_rider_number, governing_bodies, venue_id, venue_name, locations, schedule_prefs, day_start_times, day_end_times, document_requirements, merchandise_enabled, merch_items, waiver_text, waiver_approved_text'
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

/**
 * The organization's saved venue library, for the Venue card's "pick a
 * saved venue" dropdown. Only rings are pulled in on selection — legacy's
 * applySavedLocation also copies the venue's address/website/phone/contact
 * into the show. venues does carry those columns (see its migration), so
 * that copy is a real, buildable follow-up; it's left out here to keep
 * Venue and Contact as two independently-edited cards for now, matching
 * how each one's own save button already works.
 */
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

/* ── Show Manager — completeness checklist ───────────────────────────────
   Backs "Incomplete Shows" and its per-show Missing Sections dialog (design:
   showstaff.html's renderShowManagerPicker + the design export's
   IncompleteShows/MissingSectionsDialog — both drove this off a static,
   same-for-every-show demo checklist; this computes each item from the
   actual row instead).

   Only sections this app can genuinely check are included. The design's
   fuller list also has Branding (logo/cover upload), Contact (address/
   phone/email), and a build/approve/publish Schedule step — Contact and
   Schedule have no Setup card yet (see show-manager/'s own module comments)
   and Branding's upload UI doesn't exist either, so there is nothing a
   database read could honestly call "done" for them. They're left out
   rather than shown permanently red — a checklist item nobody can ever
   check off isn't information, it's decoration. */

export interface CompletenessSection {
  name: string;
  ok: boolean;
  items: { label: string; ok: boolean }[];
}

export interface ShowCompleteness {
  sections: CompletenessSection[];
  /** True once every checkable section is done. Doesn't require Contact/Branding/Schedule — see the module comment above. */
  complete: boolean;
}

export async function getShowCompleteness(showId: string): Promise<ShowCompleteness> {
  const supabase = await createServerClient();

  const [show, divisions, classes, docs, staff, catalog] = await Promise.all([
    supabase
      .from('shows')
      .select(
        'name, start_date, end_date, timezone, locations, waiver_text, waiver_approved_text, show_details, show_type, governing_bodies'
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

  // org lives in show_details jsonb, same place updateShowDetails writes it.
  const org = ((show.data.show_details ?? {}) as { org?: string }).org ?? '';
  const governingBodies = (show.data.governing_bodies ?? []) as unknown as string[];
  /**
   * Governing bodies is only meaningful for a rated show — the Show Details
   * card only renders the checkboxes when showType === 'rated' (see
   * show-details-card.tsx), and a Schooling Show is meant to run with none
   * checked. Checking it unconditionally would flag every schooling show as
   * permanently incomplete.
   *
   * Show type itself isn't a separate item: createShow always writes one
   * (it's a required enum with no unset state, and getShowSetupDetail falls
   * back to 'rated' besides), so a checklist item for it could never read
   * as missing — same "decoration, not information" reasoning as the
   * excluded sections below.
   */
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
      /* No column distinguishes "reviewed this and decided none are
         needed" from "never opened this card" — legacy's
         documentRequirementsSkipped flag never made it into this schema.
         A show that genuinely needs zero documents reads as incomplete
         here; that's a real gap, not a bug, and worth a real skip flag
         later rather than a guess now. */
      name: 'Required Documents',
      items: [{ label: 'At least one requirement listed', ok: docs.length > 0 }],
      ok: docs.length > 0,
    },
    {
      // Same gap as above: "off" (the default) and "not decided yet" are
      // both merchandise_enabled=false. Flags a show that deliberately
      // isn't selling merch as still-incomplete.
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

/**
 * The billing tab's simple profit-and-loss.
 *
 * Expenses are a jsonb checklist on the show rather than a ledger — the legacy
 * schema was explicit that this is a cost checklist, not accounting. Revenue is
 * reported in two parts: what has actually been collected, and what the roster is
 * worth at current prices. Merging them would present money nobody has paid as
 * income.
 */
export async function getShowBilling(showId: string): Promise<ShowBilling> {
  const supabase = await createServerClient();

  const [orders, show, merch, vendors, classes] = await Promise.all([
    supabase.from('orders').select('amount_total').eq('show_id', showId).eq('status', 'paid'),
    supabase.from('shows').select('expenses').eq('id', showId).single(),
    supabase.from('merch_sales').select('total').eq('show_id', showId),
    supabase.from('vendor_bookings').select('amount_total').eq('show_id', showId).eq('status', 'paid'),
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
        classes.data.map((c) => c.id)
      );
    if (entryError) throw entryError;
    entryValue = entries.reduce((sum, e) => sum + (feeByClass.get(e.class_id) ?? 0), 0);
  }

  const expenses = (show.data.expenses ?? []) as { id: string; label: string; amount: number }[];

  return {
    settledRevenue: orders.data.reduce((sum, o) => sum + o.amount_total, 0),
    paidOrders: orders.data.length,
    entryValue,
    vendorRevenue: vendors.data.reduce((sum, v) => sum + (v.amount_total ?? 0), 0),
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
  /** Ring names from shows.locations, for the per-group location dropdown. */
  ringNames: string[];
  /** Already-created classes, so a group that is on the show reads as checked. */
  classes: { id: string; label: string; division: string | null; fee: number; location: string | null }[];
}

/**
 * Everything the Select Events tab renders.
 *
 * ticket_close stores one string; the design edits it as a date and a time, so
 * it is split on the space here and recombined in the mutation. A close value
 * carrying no time yields an empty time field rather than a fabricated midnight.
 */
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

/* ── Show Manager — Rider Entries tab ────────────────────────────────────
   Branding, Add-Ons, Vendor Space Map, Vendor Spaces, Qualifications.
   Design: Field & Arena Admin Console.dc.html, the smRiders block (lines
   1609–1765). Add-Ons/Vendor Spaces/Qualifications reuse the add_ons/
   vendor_items/qual_types tables getSalesCatalog already reads for the
   billing tab, but this is its own leaner read scoped to just this tab's
   three lists plus branding/vendor-map/publish state — getSalesCatalog also
   pulls merch_items and merch_sales, which have no job here. */

export interface CatalogListItem {
  id: string;
  name: string;
  price: number;
}

export interface VendorSpaceItem extends CatalogListItem {
  /** Null means unlimited, matching add_ons/vendor_items' own qty convention. */
  qty: number | null;
}

export interface RiderEntriesData {
  showId: string;
  showName: string;
  published: boolean;
  /**
   * Why the "Not published" banner shows, or null if the show is published.
   * Computed here rather than in the UI: it reads waiver_text/
   * waiver_approved_text, which this tab has no other reason to fetch.
   */
  notPublishedReason: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  /** Signed (vendor-maps is a private bucket) — null if no map uploaded yet. */
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
        'id, name, published, start_date, end_date, waiver_text, waiver_approved_text, logo_path, show_image_path, vendor_map_path, vendor_map_url'
      )
      .eq('id', showId)
      .maybeSingle(),
    supabase.from('add_ons').select('id, name, price').eq('show_id', showId).order('name'),
    supabase.from('vendor_items').select('id, name, price, qty').eq('show_id', showId).order('name'),
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

  const logoUrl = s.logo_path ? supabase.storage.from('logos').getPublicUrl(s.logo_path).data.publicUrl : null;
  const bannerUrl = s.show_image_path
    ? supabase.storage.from('show-images').getPublicUrl(s.show_image_path).data.publicUrl
    : null;

  let vendorMapUrl: string | null = null;
  if (s.vendor_map_path) {
    const { data } = await supabase.storage.from('vendor-maps').createSignedUrl(s.vendor_map_path, 3600);
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
    vendorSpaces: vendorItems.data.map((v) => ({ id: v.id, name: v.name, price: v.price ?? 0, qty: v.qty })),
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
}

export interface ScheduleReviewData {
  showId: string;
  showName: string;
  classes: ScheduleReviewClassRow[];
  ringNames: string[];
  /** Passed through so the client can recompute a live platform-fee preview as an organizer edits a fee, without waiting on a round trip. */
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
      .select('id, event, label, display_name, division, location, arena, judges_count, fee')
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
    { classCount: 0, entryCount: 0, grossFees: 0, platformFees: 0 }
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

export interface TestTemplateRow {
  id: string;
  name: string;
  level: string | null;
  sourceLabel: string | null;
  movements: TestTemplateMovement[];
  collectives: TestTemplateCollective[];
  updatedAt: string;
}

/**
 * Test Builder tab: the organization's own library of dressage test
 * templates — org-scoped rather than show-scoped, since the same test gets
 * reused across shows. Distinct from class_tests (the test actually assigned
 * to one class) and scoring_catalog (the platform's reference sheets).
 */
export async function listTestTemplates(orgId: string): Promise<TestTemplateRow[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('test_templates')
    .select('id, name, level, source_label, movements, collectives, updated_at')
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
  }));
}

export interface TestBuilderPageData {
  showId: string;
  showName: string;
  orgId: string;
  templates: TestTemplateRow[];
}

/** Show Manager, Test Builder tab: the show's identity (for the shell) plus its organization's test library. */
export async function getTestBuilderPageData(showId: string): Promise<TestBuilderPageData | null> {
  const supabase = await createServerClient();

  const show = await supabase.from('shows').select('id, name, org_id').eq('id', showId).maybeSingle();
  if (show.error) throw show.error;
  if (!show.data) return null;

  const templates = await listTestTemplates(show.data.org_id);

  return { showId: show.data.id, showName: show.data.name, orgId: show.data.org_id, templates };
}
