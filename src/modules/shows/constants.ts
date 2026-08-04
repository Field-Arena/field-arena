/**
 * The Select Events catalog — ported verbatim from showstaff.html's
 * SM_HIERARCHY and SM_GROUP_ARENA_DEFAULTS.
 *
 * Three levels deep: a category ("Introductory through Fourth Level"), the
 * groups inside it ("Training Level"), and the individual tests inside those
 * ("Training Level Test 1"). Checking a group is what creates classes — one per
 * test — which is why the design shows a test count against every group rather
 * than a checkbox per test.
 *
 * Hardcoded rather than read from scoring_catalog on purpose. This is the menu
 * of what an organizer may offer, which is fixed by the governing bodies;
 * scoring_catalog holds the sheets those tests are scored against, and is
 * uploaded per test. The two are related but neither derives from the other —
 * the legacy build kept them separate for the same reason.
 */
export const SM_HIERARCHY = {
  'Introductory through Fourth Level': {
    Introductory: ['Introductory Test A', 'Introductory Test B', 'Introductory Test C'],
    'Training Level': ['Training Level Test 1', 'Training Level Test 2', 'Training Level Test 3'],
    'First Level': ['First Level Test 1', 'First Level Test 2', 'First Level Test 3'],
    'Second Level': ['Second Level Test 1', 'Second Level Test 2', 'Second Level Test 3'],
    'Third Level': ['Third Level Test 1', 'Third Level Test 2', 'Third Level Test 3'],
    'Fourth Level': ['Fourth Level Test 1', 'Fourth Level Test 2', 'Fourth Level Test 3'],
  },
  'Freestyle / Pas de Deux / Quadrille': {
    Freestyle: [
      'Training Level',
      'First Level',
      'Second Level',
      'Third Level',
      'Fourth Level',
    ],
    'Pas de Deux': ['Pas de Deux'],
    Quadrille: [
      'Introductory Level',
      'Training Level',
      'First Level',
      'Second Level',
      'Third Level',
      'Freestyle',
    ],
  },
  'Sport Horse': {
    'Individual Class': [
      'Prospect (in hand)',
      'Breeding Stock (in hand)',
      'Group Class (in hand)',
      'Prospect (under saddle)',
    ],
    'Master Class': [
      'Prospect (in hand)',
      'Breeding Stock (in hand)',
      'Group Class (in hand)',
      'Prospect (under saddle)',
    ],
    Championship: ['Sport Horse Championship Class'],
    Materiale: ['Sport Horse Materiale Class'],
    Handler: ['Amateur / Junior / Young Rider Handler'],
  },
  'Dressage Seat Equitation': {
    Equitation: ['Dressage Seat Equitation', 'Individual Pattern'],
    'Dressage Seat Medals': ['Dressage Seat Medals', 'Individual Pattern'],
  },
  'Developing Horse / Young Horse': {
    'Young Horse': ['Four-Year-Old Dressage Test'],
    'Developing Horse': ['Prix St. Georges, 7-9yo', 'Grand Prix, 8-10yo'],
  },
} as const;

export type CatalogCategory = keyof typeof SM_HIERARCHY;

/** Category order as the design lists them — object key order is not a contract. */
export const CATALOG_CATEGORIES = [
  'Introductory through Fourth Level',
  'Freestyle / Pas de Deux / Quadrille',
  'Sport Horse',
  'Dressage Seat Equitation',
  'Developing Horse / Young Horse',
] as const;

/**
 * Arena size per category::group, from SM_GROUP_ARENA_DEFAULTS.
 *
 * Sport Horse is absent from that map because the legacy `smDefaultArenaFor`
 * short-circuits the whole category to one value before consulting it — the
 * classes are judged in hand on a triangle, not in a dressage arena at all.
 */
const GROUP_ARENA_DEFAULTS: Record<string, string> = {
  'Introductory through Fourth Level::Introductory': 'Small, 20m x 40m',
  'Introductory through Fourth Level::Training Level': 'Small, 20m x 40m',
  'Introductory through Fourth Level::First Level': 'Small, 20m x 40m',
  'Introductory through Fourth Level::Second Level': 'Standard, 20m x 60m',
  'Introductory through Fourth Level::Third Level': 'Standard, 20m x 60m',
  'Introductory through Fourth Level::Fourth Level': 'Standard, 20m x 60m',
  'Freestyle / Pas de Deux / Quadrille::Freestyle': 'Standard, 20m x 60m',
  'Freestyle / Pas de Deux / Quadrille::Pas de Deux': 'Standard, 20m x 60m',
  'Freestyle / Pas de Deux / Quadrille::Quadrille': 'Standard, 20m x 60m',
  'Dressage Seat Equitation::Equitation': 'Standard, 20m x 60m',
  'Dressage Seat Equitation::Dressage Seat Medals': 'Standard, 20m x 60m',
  'Developing Horse / Young Horse::Young Horse': 'Standard, 20m x 60m',
  'Developing Horse / Young Horse::Developing Horse': 'Standard, 20m x 60m',
};

/** Mirrors showstaff.html's smDefaultArenaFor(ev, group). */
export function defaultArenaFor(category: string, group: string): string {
  if (category === 'Sport Horse') return 'In-hand triangle, no rail letters';
  return GROUP_ARENA_DEFAULTS[`${category}::${group}`] ?? 'Standard, 20m x 60m';
}

/** The design's default entry fee, shown in every category's "Default price ($)" box. */
export const DEFAULT_CLASS_FEE = 65;

/**
 * Groups, with their tests, for one category. A plain helper so the UI never
 * indexes into SM_HIERARCHY with a computed key and loses its types.
 */
export function groupsFor(
  category: CatalogCategory
): { group: string; tests: readonly string[] }[] {
  return Object.entries(SM_HIERARCHY[category]).map(([group, tests]) => ({
    group,
    tests: tests as readonly string[],
  }));
}

/**
 * The governing-body sets behind the "+ FEI" / "+ USEF/USDF" / "+ Independent"
 * buttons, ported verbatim from the design's FM_SETS.
 *
 * Distinct from SM_HIERARCHY above: that is the show's own event catalog, while
 * these are published test sets an organizer opts into wholesale. Each opens a
 * dialog listing its levels and tests to check off.
 *
 * Independent is empty by design — those tests come from an organization's own
 * Test Builder library, and the design states the empty case outright rather
 * than inventing rows ("No organization has built an Independent test yet.").
 */
export const FM_SETS = {
  '+ FEI': [
    { name: 'Prix St. Georges', tests: ['Prix St. Georges (2026)'] },
    { name: 'Intermediate A', tests: ['Intermediate A (2026)'] },
    { name: 'Intermediate B', tests: ['Intermediate B (2026)'] },
    { name: 'Intermediate I', tests: ['Intermediate I (2026)', 'Intermediate I Freestyle (2022)'] },
    { name: 'Grand Prix', tests: ['Grand Prix (2026)', 'Grand Prix Freestyle (2022)'] },
  ],
  '+ USEF/USDF': [
    {
      name: 'Introductory',
      tests: [
        'Introductory Level Test A (2023)',
        'Introductory Level Test B (2023)',
        'Introductory Level Test C (2023)',
      ],
    },
    {
      name: 'Training',
      tests: [
        'Training Level Test 1 (2023)',
        'Training Level Test 2 (2023)',
        'Training Level Test 3 (2023)',
        'Training Level Freestyle (2023)',
      ],
    },
    {
      name: 'First',
      tests: [
        'First Level Test 1 (2023)',
        'First Level Test 2 (2023)',
        'First Level Test 3 (2023)',
        'First Level Freestyle (2023)',
      ],
    },
    {
      name: 'Second',
      tests: [
        'Second Level Test 1 (2023)',
        'Second Level Test 2 (2023)',
        'Second Level Test 3 (2023)',
        'Second Level Freestyle (2023)',
      ],
    },
    {
      name: 'Third',
      tests: [
        'Third Level Test 1 (2023)',
        'Third Level Test 2 (2023)',
        'Third Level Test 3 (2023)',
        'Third Level Freestyle (2023)',
      ],
    },
    {
      name: 'Fourth',
      tests: [
        'Fourth Level Test 1 (2023)',
        'Fourth Level Test 2 (2023)',
        'Fourth Level Test 3 (2023)',
        'Fourth Level Freestyle (2023)',
      ],
    },
  ],
  '+ Independent': [],
} as const;

export type FmSetName = keyof typeof FM_SETS;

/** The buttons above the catalog, in the design's own order. */
export const EVENT_SOURCE_BUTTONS = [
  '+ FEI',
  '+ USEF/USDF',
  '+ Independent',
  '+ Test of Choice (TOC)',
  '+ Add Custom Class',
] as const;

/**
 * The second, priced button row. In the design these carry no handler — they
 * are drawn and inert. They are wired here to qualifying types, which is the
 * real thing a priced governing-body button adds to a show: a per-class opt-in
 * fee riders pay on top of the entry (see the qual_types table).
 */
export const QUAL_TYPE_PRESETS = [
  { body: 'FEI', price: 20 },
  { body: 'USDF', price: 20 },
  { body: 'USEF', price: 20 },
] as const;

/* ── Show Manager — Rider Entries tab ────────────────────────────────────── */

/**
 * The Vendor Spaces card's "Load standard space list" button — ported
 * verbatim from showstaff.html's VENDOR_SPACE_TEMPLATE, whose own comment
 * says these names/prices came from a real GDCTA Region 3 paper vendor
 * application form. The design's button label abbreviates these for its own
 * copy ("Indoor $650", "Truck & Trailer $400", …); the names inserted here
 * are the fuller legacy ones, since this is behavior ported from the real
 * source, not a re-typing of the button's display text.
 */
export const VENDOR_SPACE_TEMPLATE = [
  { name: 'Indoor Vendor Space', price: 650 },
  { name: 'Truck & Trailer Location', price: 400 },
  { name: 'Courtyard Trailer Parking', price: 300 },
  { name: 'Tent (bring your own)', price: 250 },
  { name: 'Outside Arena Table Top', price: 200 },
  { name: 'Electricity Required (30 amp)', price: 25 },
  { name: 'Electricity Required (50 amp)', price: 50 },
] as const;

/* ── Show Manager — Test Builder tab ─────────────────────────────────────── */

/**
 * "Start from a template" starter tests, ported verbatim from showstaff.html's
 * TB_STARTER_TESTS — real USDF Training Level movement text, kept as a
 * client-side starting point for "+ New Test" rather than seed rows in
 * test_templates, since they belong to no organization until an organizer
 * actually clones one into their own library.
 */
export const TB_STARTER_TESTS = [
  {
    key: 'tl1',
    name: 'Training Level Test 1',
    level: 'Training Level',
    movements: [
      { num: 1, text: 'A — Enter working trot, track left at C', coef: 1 },
      { num: 2, text: 'HXF — Change rein, working trot', coef: 1 },
      { num: 3, text: 'A — Down centerline, halt, salute, proceed working trot', coef: 2 },
      { num: 4, text: 'C — Track right, working trot', coef: 1 },
      { num: 5, text: 'HXF — Change rein, working trot', coef: 1 },
      { num: 6, text: 'A — Circle right 20m, working trot', coef: 1 },
      { num: 7, text: 'Working canter right lead, circle right 20m', coef: 1 },
      { num: 8, text: 'A — Down centerline, halt, salute', coef: 2 },
    ],
    collectives: [
      { key: 'gaits', label: 'Gaits (freedom and regularity)', coef: 1 },
      { key: 'impulsion', label: 'Impulsion (desire to move forward, elasticity of steps)', coef: 1 },
      { key: 'submission', label: 'Submission (attention, confidence, harmony)', coef: 1 },
      { key: 'rider', label: "Rider's position and seat", coef: 1 },
      { key: 'aids', label: "Rider's correct and effective use of aids", coef: 1 },
    ],
  },
  {
    key: 'tl2',
    name: 'Training Level Test 2',
    level: 'Training Level',
    movements: [
      { num: 1, text: 'A — Enter working trot, track right at C', coef: 1 },
      { num: 2, text: 'MXK — Change rein, working trot', coef: 1 },
      { num: 3, text: 'A — Down centerline, halt, salute, proceed working trot', coef: 2 },
      { num: 4, text: 'C — Track left, working trot', coef: 1 },
      { num: 5, text: 'HXF — Change rein, rising trot', coef: 1 },
      { num: 6, text: 'E — Circle left 20m, working trot', coef: 1 },
      { num: 7, text: 'Working canter left lead, circle left 20m', coef: 1 },
      { num: 8, text: 'Working canter right lead, circle right 20m', coef: 1 },
      { num: 9, text: 'A — Down centerline, halt, salute', coef: 2 },
    ],
    collectives: [
      { key: 'gaits', label: 'Gaits (freedom and regularity)', coef: 1 },
      { key: 'impulsion', label: 'Impulsion (desire to move forward, elasticity of steps)', coef: 1 },
      { key: 'submission', label: 'Submission (attention, confidence, harmony)', coef: 1 },
      { key: 'rider', label: "Rider's position and seat", coef: 1 },
      { key: 'aids', label: "Rider's correct and effective use of aids", coef: 1 },
    ],
  },
  {
    key: 'tl3',
    name: 'Training Level Test 3',
    level: 'Training Level',
    movements: [
      { num: 1, text: 'A — Enter working trot, track left at C', coef: 1 },
      { num: 2, text: 'KXM — Change rein, working trot', coef: 1 },
      { num: 3, text: 'A — Down centerline, halt, salute, proceed working trot', coef: 2 },
      { num: 4, text: 'C — Track right, working trot', coef: 1 },
      { num: 5, text: 'Working canter right lead, circle right 20m', coef: 1 },
      { num: 6, text: 'HXF — Change rein, working canter to trot', coef: 1 },
      { num: 7, text: 'Working canter left lead, circle left 20m', coef: 1 },
      { num: 8, text: 'Stretch circle 20m, working trot rising', coef: 1 },
      { num: 9, text: 'Free walk across the diagonal', coef: 2 },
      { num: 10, text: 'A — Down centerline, halt, salute', coef: 2 },
    ],
    collectives: [
      { key: 'gaits', label: 'Gaits (freedom and regularity)', coef: 1 },
      { key: 'impulsion', label: 'Impulsion (desire to move forward, elasticity of steps)', coef: 1 },
      { key: 'submission', label: 'Submission (attention, confidence, harmony)', coef: 1 },
      { key: 'rider', label: "Rider's position and seat", coef: 1 },
      { key: 'aids', label: "Rider's correct and effective use of aids", coef: 1 },
    ],
  },
  {
    key: 'tl4',
    name: 'Training Level Test 4',
    level: 'Training Level',
    movements: [
      { num: 1, text: 'A — Enter working trot, track right at C', coef: 1 },
      { num: 2, text: 'FXH — Change rein, working trot', coef: 1 },
      { num: 3, text: 'A — Down centerline, halt, salute, proceed working trot', coef: 2 },
      { num: 4, text: 'C — Track left, working trot', coef: 1 },
      { num: 5, text: 'Working canter left lead, circle left 20m', coef: 1 },
      { num: 6, text: 'KXM — Change rein, working canter to trot', coef: 1 },
      { num: 7, text: 'Working canter right lead, circle right 20m', coef: 1 },
      { num: 8, text: 'Stretch circle 20m, working trot rising', coef: 1 },
      { num: 9, text: 'Free walk across the diagonal', coef: 2 },
      { num: 10, text: 'Medium walk, track left', coef: 1 },
      { num: 11, text: 'Working trot, down centerline from C', coef: 1 },
      { num: 12, text: 'A — Down centerline, halt, salute', coef: 2 },
    ],
    collectives: [
      { key: 'gaits', label: 'Gaits (freedom and regularity)', coef: 1 },
      { key: 'impulsion', label: 'Impulsion (desire to move forward, elasticity of steps)', coef: 1 },
      { key: 'submission', label: 'Submission (attention, confidence, harmony)', coef: 1 },
      { key: 'rider', label: "Rider's position and seat", coef: 1 },
      { key: 'aids', label: "Rider's correct and effective use of aids", coef: 1 },
    ],
  },
] as const;

/* ── Horses screen ────────────────────────────────────────────────────────── */

/**
 * The one document requirement label horses-queries.ts's "Coggins expired"
 * KPI specifically checks for, matching showstaff.html's own hardcoded
 * `req.label==='Coggins'` comparison (~13749) rather than a generic
 * "any expired document" count.
 */
export const COGGINS_LABEL = 'Coggins';

/**
 * KPI tile tints for the Horses screen's four counts (✓ Complete /
 * ✗ Incomplete / Needs verification / Coggins expired) — the same
 * success/warn/danger hex pairs as globals.css's status tokens, reused
 * directly since StatCard takes raw color strings rather than Tailwind
 * classes.
 */
export const HORSE_STAT_TINTS = {
  complete: { bg: '#DCEFE1', fg: '#2E7D46' },
  incomplete: { bg: '#F7E1E1', fg: '#B23A3A' },
  needsVerification: { bg: '#FCEBD2', fg: '#9A6A12' },
  cogginsExpired: { bg: '#F7E1E1', fg: '#B23A3A' },
  /** The Horses screen's 5th tile, shown only once a stable chart has stalls — mirrors showstaff.html's stableStallsKpiHtml (~14033). */
  stallsOccupied: { bg: '#E4F0E8', fg: '#1A5B3C' },
} as const;

/* ── Stable Chart ─────────────────────────────────────────────────────────
   shows.stable_chart's stables/stalls caps. Deliberately local copies of
   organizations/constants.ts's MAX_STABLES/MAX_STALLS_PER_STABLE — a module
   must not reach into another module's internals (folder-structure.md) even
   though both jsonb documents store a structurally similar stable/stall
   shape. Neither cap is from legacy, which enforces none — sane engineering
   guards generous enough that no real barn hits them. */
export const MAX_STABLES = 40;
export const MAX_STALLS_PER_STABLE = 300;

/* ── Financial (Billing) tab ─────────────────────────────────────────────── */

/**
 * The expense lines every show starts with, ported verbatim from
 * showstaff.html's DEFAULT_SHOW_EXPENSES.
 *
 * Pre-filled at zero rather than left blank: the legacy card's own note is
 * "the most common horse-show cost lines, pre-filled — edit amounts, rename, or
 * remove any that don't apply", and an organizer costing a show recognises the
 * list faster than they would recall it from nothing.
 */
export const DEFAULT_SHOW_EXPENSES = [
  'Venue / facility rental',
  'Judges',
  'Stewards / TDs',
  'Announcer',
  'Scoring / secretary staff',
  'Footing / arena maintenance',
  'EMT / on-site medical',
  'Ribbons, prizes & awards',
  'Insurance',
  'Sanctioning / governing body fees',
  'Stabling & bedding',
  'Portable toilets',
  'Trash removal',
  'Marketing & advertising',
  'Office / merchant processing fees',
] as const;

/**
 * The confirmed payout architecture, verbatim from STRIPE_PAYOUT_DECISIONS.
 *
 * Kept as prose rather than turned into settings: these are decisions already
 * taken about how money moves, and the one still open is marked as such rather
 * than quietly dropped.
 */
export const STRIPE_PAYOUT_DECISIONS = [
  'Payout timing: after the show ends.',
  'Holdback: SuperAdmin-configurable per organizer (cadence + holdback %), not a fixed platform policy.',
  'Onboarding: Stripe Connect Express.',
  "Unfinished onboarding: revenue holds in Field & Arena's balance until the organizer completes onboarding — never blocks a show from going on sale.",
  "Refund recovery: debited from the organizer's connected bank account directly.",
  'Fee deduction: taken out before the transfer (organizer receives net).',
  'Multi-show organizers: payouts calculated per-show, not batched.',
  'Payout visibility: organizers see a live pending balance before the transfer happens.',
  'Currency / geography: US-only at launch; international is a planned expansion (every org already carries a real currency code).',
  'Still open — Tax reporting (1099-K issuance): not decided, flagged for accountant review before launch.',
  "Dispute / chargeback liability: deducted from that specific organizer's balance.",
] as const;

/** P&L category order, from pnlGenerateReport's catOrder. */
export const PNL_CATEGORY_ORDER = [
  'Entry Fees',
  'Add-ons & Stabling',
  'Vendor Items',
  'Merchandise',
  'Other',
] as const;

/** The three money views above the P&L, from billingSectionCard's call sites. */
export const BILLING_SECTIONS = [
  {
    kind: 'charges',
    icon: '💳',
    title: 'Charges',
    sub: 'Payments collected from riders and vendors across every show.',
  },
  {
    kind: 'payouts',
    icon: '💰',
    title: 'Payouts',
    sub: 'What you actually receive — transfers to you after the platform fee is deducted.',
  },
  {
    kind: 'deposits',
    icon: '🧾',
    title: 'Deposits',
    sub: 'Money that has actually landed in the Field & Arena bank account.',
  },
] as const;

/* ── Awards ──────────────────────────────────────────────────────────────
   Ported from showstaff.html's RIBBONS / ribbon(). */

/**
 * Ribbon colours by placing, in order. Ported verbatim — these are the
 * traditional colours, not a palette choice: blue is first, red second, and an
 * organizer counting ribbons to bring recognises the list by sight.
 *
 * Eight, not the design export's six — the legacy list runs to Purple and
 * Brown, and a class can award up to twenty places. Beyond eight, a placing
 * shows a neutral chip rather than inventing a colour.
 */
export const RIBBONS = [
  { place: '1st', name: 'Blue', bg: '#1E5AA8', fg: '#FFFFFF' },
  { place: '2nd', name: 'Red', bg: '#C0392B', fg: '#FFFFFF' },
  { place: '3rd', name: 'Yellow', bg: '#E4B21E', fg: '#3A2F00' },
  { place: '4th', name: 'White', bg: '#FFFFFF', fg: '#22271F' },
  { place: '5th', name: 'Pink', bg: '#E58FB0', fg: '#4A1F30' },
  { place: '6th', name: 'Green', bg: '#2E7D46', fg: '#FFFFFF' },
  { place: '7th', name: 'Purple', bg: '#6B4E9E', fg: '#FFFFFF' },
  { place: '8th', name: 'Brown', bg: '#7A5230', fg: '#FFFFFF' },
] as const;

/** Mirrors legacy's `ribbon(i)` fallback for placings past the named colours. */
export const RIBBON_FALLBACK = { place: '', name: '', bg: '#E7EEE9', fg: '#1F3A2E' } as const;

export interface RibbonColor {
  name: string;
  bg: string;
  fg: string;
}

/** Placing label for a zero-based rank: 1st, 2nd, 3rd, then 4th onward. */
function placeLabel(index: number): string {
  return RIBBONS[index]?.place ?? `${String(index + 1)}th`;
}

/**
 * The ribbon for a zero-based placing, ported from legacy `ribbon(i, override)`.
 *
 * A class carrying its own colours (a championship with sponsor ribbons, say)
 * wins over the standard order; past the end of either list the placing gets a
 * neutral chip rather than an invented colour.
 */
export function ribbonFor(
  index: number,
  override?: RibbonColor[] | null
): {
  place: string;
  name: string;
  bg: string;
  fg: string;
} {
  const custom = override?.[index];
  if (custom) return { place: placeLabel(index), ...custom };
  return RIBBONS[index] ?? { ...RIBBON_FALLBACK, place: placeLabel(index) };
}
