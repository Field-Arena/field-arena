import type {
  ENTRY_ISSUE_KINDS,
  MEMBERSHIP_FLAGS,
  SHOW_ENTRY_STATUSES,
  STALL_STATUSES,
} from './constants';
import type { MasterSchedule } from './schedule-engine';
import type { AwardsReport } from './awards-engine';

export interface ArrivalDepartureRow {
  riderId: string;
  riderName: string;
  trainerName: string;
  horseStalls: number;
  tackStalls: number;
  arrivalDate: string | null;
  departureDate: string | null;
}

export interface BackNumberCard {
  backNumber: string;
}

export interface NumberRangeRow {
  id: string;
  rangeStart: number;
  rangeEnd: number;
  label: string | null;
  total: number;
  assigned: number;
  available: number;
  unavailable: number;
}

export interface UnavailableNumberRow {
  number: number;
  reason: string | null;
}

export interface WaitingHorseRow {
  showHorseId: string;
  horseName: string;
}

export interface BridleNumberChangeRow {
  id: string;
  showHorseId: string;
  horseName: string;
  oldNumber: string | null;
  newNumber: string | null;
  reason: string | null;
  changedAt: string;
}

export interface BridleNumberPoolStatus {
  showId: string;
  showName: string;
  ranges: NumberRangeRow[];
  counts: { available: number; assigned: number; unavailable: number };
  unavailableNumbers: UnavailableNumberRow[];
  waitingHorses: WaitingHorseRow[];
  recentChanges: BridleNumberChangeRow[];
}

export type EntryIssueKind = (typeof ENTRY_ISSUE_KINDS)[number];

export interface EntryIssueRow {
  id: string;
  showEntryId: string;
  entryNumber: string;
  bridleNumber: string;
  riderName: string;
  horseName: string;
  kind: EntryIssueKind;
  message: string;
  detail: string | null;
  status: 'open' | 'resolved';
  source: 'auto' | 'manual';
  createdAt: string;
  resolvedAt: string | null;
  resolutionNote: string | null;
}

export interface IssuesPageData {
  showId: string;
  showName: string;
  issues: EntryIssueRow[];
  entries: { id: string; label: string }[];
}

export type ShowEntryStatus = (typeof SHOW_ENTRY_STATUSES)[number];

export type DocumentRollupStatus = 'complete' | 'needs_attention' | 'missing';

export interface EntryDetailClassLine {
  classId: string;
  classLabel: string;
  fee: number;
}

export interface EntryDetailDocument {
  requirementId: string;
  label: string;
  status: string;
  expirationDate: string | null;
}

export interface EntryDetailIssue {
  id: string;
  kind: string;
  message: string;
  detail: string | null;
  status: string;
}

export interface EntryLedgerRow {
  showEntryId: string;
  showHorseId: string;
  entryNumber: string;
  bridleNumber: string | null;
  backNumber: string | null;
  riderName: string;
  riderId: string | null;
  horseName: string;
  horseId: string | null;
  classes: string[];
  classLines: EntryDetailClassLine[];
  status: ShowEntryStatus;
  fees: number;
  amountPaid: number;
  balance: number;
  documentStatus: DocumentRollupStatus;
  documents: EntryDetailDocument[];
  openIssueCount: number;
  issues: EntryDetailIssue[];
}

export interface EntryLedgerPageData {
  showId: string;
  showName: string;
  rows: EntryLedgerRow[];
}

export interface ManualHorseEntry {
  id: string;
  riderName: string;
  horseName: string;
  isStallion: boolean;
  addedAt: string;
}

export type DocumentReviewStatus = 'pending' | 'approved' | 'rejected' | 'replacement_requested';

export interface HorseDocumentStatus {
  requirementId: string;
  label: string;
  uploaded: boolean;

  url: string | null;
  expirationDate: string | null;
  requiresExpiration: boolean;
  requiresApproval: boolean;
  verified: boolean;

  expired: boolean;

  needsApproval: boolean;

  status: DocumentReviewStatus;
  rejectionReason: string | null;
  rejectionNote: string | null;
}

export interface HorseRow {
  key: string;

  horseId: string | null;
  horseName: string;
  riderLabel: string;

  riderEmail: string | null;
  classesCount: number;
  isStallion: boolean;
  height: string | null;
  farrier: string | null;
  trainer: string | null;
  stable: string | null;
  documents: HorseDocumentStatus[];

  complete: boolean;
  missingLabels: string[];
  needsVerification: boolean;
  cogginsExpired: boolean;

  /* This same horse appears on class_entries under more than one rider name
   * — a lease or catch-ride horse, not a data error. riders lists every
   * distinct name seen so the organizer can see who, not just how many. */
  isMultiEntry: boolean;
  riders: string[];
}

export interface HorsesPageData {
  showId: string;
  showName: string;
  requirements: DocumentRequirement[];
  rows: HorseRow[];
}

export interface ShowManagerHeader {
  id: string;
  name: string;
}

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

export interface DivisionRow {
  id: string;
  name: string;
  position: number;
  classCount: number;
  defaultFee: number | null;
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

export interface ShowDocumentRow {
  id: string;
  name: string;

  url: string | null;
  path: string;
  eventIds: string[];
  createdAt: string;
}

export interface DocumentsPageData {
  showId: string;
  showName: string;
  documents: ShowDocumentRow[];
  classes: { id: string; label: string }[];
}

export interface DocumentRequirement {
  id: string;
  label: string;
  requiresExpiration?: boolean;
  requiresApproval?: boolean;
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
  slug: string | null;
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
  waiverDocumentUrl: string | null;
  waiverDocumentName: string | null;
}

export interface VenueOption {
  id: string;
  name: string;
  rings: RingRow[];
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

export interface ShowBilling {
  settledRevenue: number;
  paidOrders: number;
  entryValue: number;
  vendorRevenue: number;
  merchRevenue: number;
  expenses: { id: string; label: string; amount: number }[];
  expenseTotal: number;
}

export interface SelectEventsDivisionOption {
  id: string;
  name: string;
  defaultFee: number | null;
}

export interface SelectEventsData {
  showId: string;
  showName: string;

  ringNames: string[];
  divisions: SelectEventsDivisionOption[];

  classes: {
    id: string;
    label: string;
    division: string | null;
    groupName: string | null;
    fee: number;
    location: string | null;
    event: string | null;
    qualifying: boolean;
    entryCount: number;
  }[];
}

export interface TicketWindowData {
  showId: string;
  ticketOpen: string;
  ticketCloseDate: string;
  ticketCloseTime: string;
}

export interface CatalogListItem {
  id: string;
  name: string;
  price: number;
  // Only meaningful for add-ons (how many horse/tack stalls one unit
  // grants) — undefined for qualifications and vendor spaces.
  stalls?: number;
  tack?: number;
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
  rings: RingRow[];

  feeModel: string;
  totals: {
    classCount: number;
    entryCount: number;
    grossFees: number;
    platformFees: number;
  };
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

export interface TestBuilderClassOption {
  id: string;
  label: string;
}

export interface SelectedClassOption {
  id: string;
  label: string;
  division: string | null;
  fee: number;
  location: string | null;
  hasTest: boolean;
}

/* The official test library (scoring_catalog, family='movement') — USEF/USDF
 * published tests an organizer can clone into their own editable library.
 * Distinct from `test_templates` (an org's own custom tests, see above). */
export interface TestCatalogEntry {
  id: string;
  title: string;
  level: string | null;
  governingBody: string | null;
  movements: TestTemplateMovement[];
  collectives: TestTemplateCollective[];
}

export interface AssignedClassOption {
  classId: string;
  label: string;
}

export interface TestBuilderPageData {
  showId: string;
  showName: string;
  orgId: string;
  templates: TestTemplateRow[];
  catalog: TestCatalogEntry[];
  classes: TestBuilderClassOption[];
  /** Every class on this show with its division/fee/location and whether it
   * already has a test assigned -- moved here from Select Events so an
   * organizer can see exactly which classes still need a test typed in. */
  selectedClasses: SelectedClassOption[];
  /** Classes currently using each template, keyed by template id (via
   * class_tests.test_template_id). Carries classId so a class can be
   * unassigned directly, not just overwritten by assigning a different
   * test. A class_tests row with no test_template_id (pre-dates the
   * column, or was never resolvable during backfill) simply isn't listed
   * under any template here -- matching it by name instead was tried and
   * removed: multiple templates can share a name, and it attached a class
   * to every one of them at once instead of the one actually in use. */
  assignedByTemplateId: Record<string, AssignedClassOption[]>;
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

  /* "How many of each test do we need to print" — every entry needs its own
   * scoresheet before it's ridden, unlike ribbons which only count entries
   * that end up placed. Keyed by resolved test name: a Test of Choice
   * entry's own test_override, or the class's single assigned test
   * (class_tests.name) for every other class. */
  testTally: Record<string, number>;

  testTotal: number;
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

  /* Rider Entries table: every horse this rider brings, a short code per
   * class ("TL-1"), and where their money stands. Payment comes from the
   * orders their entries were bought through — entries with no order (added
   * by staff) count as unpaid. */
  horses: string[];
  classCodes: { code: string; scratched: boolean }[];
  payment: 'paid' | 'pending' | 'scratched';
  outstanding: number;
  refunded: number;
}

export interface ShowRiders {
  showId: string;
  showName: string;
  startDate: string | null;
  riders: RiderListRow[];

  onSiteByDay: Record<number, string[]>;
  totalDays: number;
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

export type MembershipFlag = (typeof MEMBERSHIP_FLAGS)[number];

export type MembershipStatusValue = 'active' | 'inactive' | 'unknown';

export type VerificationStatusValue = 'unverified' | 'verified' | 'flagged';

export interface MembershipLedgerRow {
  showEntryId: string;
  entryNumber: string;
  bridleNumber: string;
  riderName: string;
  horseName: string;
  association: string | null;
  riderMembershipNumber: string | null;
  horseRegistrationNumber: string | null;
  ownerMembershipNumber: string | null;
  membershipStatus: MembershipStatusValue;
  horseRegistrationStatus: MembershipStatusValue;
  verificationStatus: VerificationStatusValue;
  flags: MembershipFlag[];
  notes: string | null;
  linkedMemberId: string | null;
  linkedMemberName: string | null;
  suggestedUsef: string | null;
  suggestedFei: string | null;
}

export interface MembershipLedgerPageData {
  showId: string;
  showName: string;
  rows: MembershipLedgerRow[];
  orgMembers: { id: string; name: string }[];
}

export interface StandardVendorSpaceRow {
  id: string;
  name: string;
  price: number;
  qty: number | null;
}

export interface PublicShowClass {
  id: string;
  label: string;
  division: string | null;
  fee: number;
  event: string | null;
  sponsor: string | null;
}

export interface PublicShowPageData {
  id: string;
  slug: string | null;
  name: string;
  dateLabel: string | null;
  startDate: string | null;
  endDate: string | null;
  orgName: string | null;
  venueName: string | null;
  logoUrl: string | null;
  website: string | null;
  phone: string | null;
  contactEmail: string | null;
  prizeListUrl: string | null;
  classes: PublicShowClass[];
}

export interface PublicShowListItem {
  id: string;
  slug: string | null;
  name: string;
  dateLabel: string | null;
  startDate: string | null;
  endDate: string | null;
  venueName: string | null;
  orgName: string | null;
  logoUrl: string | null;
}

export interface ShowListItem {
  id: string;
  slug: string | null;
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

export interface ShowManagerVitals {
  stats: ShowStats;
  stage: string;
}

export interface DashboardShowRow {
  id: string;
  slug: string | null;
  name: string;
  dateLabel: string | null;
  stage: string;
  riderCount: number;
}

export interface DashboardReadiness {
  schedulePublished: boolean;
  judgesTotal: number;
  judgesAccepted: number;
}

export interface RunShowData {
  showId: string;
  showSlug: string | null;
  showName: string;
  stage: string;
  published: boolean;
  publishedAt: string | null;
  waiverApproved: boolean;
  runner: { ticketClosed: boolean; approved: boolean };
  stats: ShowStats;
  classResults: { total: number; resultsPublished: number; scoringOpen: number };
}

export interface IncompleteShowSummary {
  id: string;
  slug: string | null;
  name: string;
  dateLabel: string | null;
  startDate: string | null;
  venueName: string | null;
}

export interface ShowPickerSummary extends IncompleteShowSummary {
  published: boolean;

  stage: string;
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

export interface AttentionItem {
  severity: 'warn' | 'info';
  label: string;
  detail: string;
  actionLabel: string;
  href: string;
}

export interface ShowResultRow {
  unitLabel: string;
  pooled: boolean;
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
  ribbonPlace: string | null;
  ribbonName: string | null;
  ribbonBg: string | null;
  ribbonFg: string | null;
}

export interface ActivityItem {
  at: string;
  title: string;
  tone: 'brand' | 'sky' | 'violet' | 'amber';
}

export interface AssociationRevenueRow {
  association: string;
  entryCount: number;
  fees: number;
  amountPaid: number;
}

export interface QuickReportsPageData {
  showId: string;
  showName: string;
  horses: HorsesPageData;
  testPrint: TestPrintPageData;
  ribbons: RibbonCountPageData;
  ledger: EntryLedgerPageData;
  byAssociation: AssociationRevenueRow[];
}

export interface TestPrintRow {
  classId: string;
  classLabel: string;
  division: string | null;
  location: string | null;
  date: string | null;
  testName: string | null;
  testEdition: string | null;
  rideCount: number;
  judgeCount: number;
  workingCopies: number;
  blankCopies: number;
  totalCopies: number;
}

export interface TestPrintPageData {
  showId: string;
  showName: string;
  rows: TestPrintRow[];
}

export interface RibbonCountRow {
  unitLabel: string;
  pooled: boolean;
  classLabels: string[];
  ribbonPlaces: number;
  // One ribbon set per non-empty placing group from unitPlacings() — the
  // same primitive the real Awards screen ranks with. Normally 1 per unit;
  // more than 1 only when the show's awardsByDivision preference splits it
  // into separate J/Y/A/O groups. Never driven by how many different tests
  // riders chose (a Test of Choice class still ranks and awards as one
  // combined group).
  ribbonSets: number;
  entryCount: number;
}

export interface RibbonCountPageData {
  showId: string;
  showName: string;
  rows: RibbonCountRow[];
}

export interface RingPacketRide {
  entryId: string;
  num: string;
  riderName: string;
  horse: string | null;
  rideOrder: number | null;
}

export interface RingPacketClass {
  classId: string;
  classLabel: string;
  division: string | null;
  location: string | null;
  date: string | null;
  testName: string | null;
  testEdition: string | null;
  rides: RingPacketRide[];
  ringPacketPrintedAt: string | null;
  needsReprint: boolean;
}

export interface RingPacketPageData {
  showId: string;
  showName: string;
  classes: RingPacketClass[];
}

// Small jsonb columns on `shows` that several screens patch one key at a time.
// (stable_chart is deliberately not here: it can be large enough that putting
// it in a compare filter would blow the request URL length.)
export type ShowJsonColumn = 'runner_state' | 'show_details' | 'schedule_prefs';

export interface StableAssignmentGroup {
  trainerKey: string;
  trainerName: string;
  horseStallsNeeded: number;
  tackStallsNeeded: number;
  stableWith: string | null;
  candidateHorseKeys: string[];
  horsesPlacedCount: number;
  horsesTotalCount: number;
}

export type StallStatus = (typeof STALL_STATUSES)[number];

export interface StableChartStall {
  id: string;
  number: number;
  label: string;

  horseId: string | null;
  horseName: string | null;
  riderName: string | null;
  trainerName: string | null;
  shavings: number;

  status: StallStatus;
  statusReason: string | null;
  note: string | null;

  isStallion: boolean;
}

export interface StableChartStable {
  id: string;
  name: string;
  stallCount: number;
  rowCount: number;
  stalls: StableChartStall[];
}

export interface StableChart {
  status: 'draft' | 'published';
  stables: StableChartStable[];
}

export interface StableChartHorseRow {
  key: string;
  riderLabel: string;
  horseName: string;
  isStallion: boolean;

  shavings: number;
}

export interface SavedLocationOption {
  id: string;
  name: string;
  stableCount: number;
}

export interface StableChartPageData {
  showId: string;
  showName: string;
  chart: StableChart;
  horseRows: StableChartHorseRow[];
  savedLocations: SavedLocationOption[];
  groups: StableAssignmentGroup[];
}

export interface StableChartSummary {
  total: number;
  occupied: number;
  available: number;
  closed: number;
  reserved: number;
  tack: number;
  hold: number;
}
