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
    Freestyle: ['Training Level', 'First Level', 'Second Level', 'Third Level', 'Fourth Level'],
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
    Equitation: ['Dressage Seat Equitation'],
    'Dressage Seat Medals': ['Dressage Seat Medals'],
  },
  'Developing Horse / Young Horse': {
    'Young Horse': ['Four-Year-Old Dressage Test'],
    'Developing Horse': ['Prix St. Georges, 7-9yo', 'Grand Prix, 8-10yo'],
  },
} as const;

export type CatalogCategory = keyof typeof SM_HIERARCHY;

export const CATALOG_CATEGORIES = [
  'Introductory through Fourth Level',
  'Freestyle / Pas de Deux / Quadrille',
  'Sport Horse',
  'Dressage Seat Equitation',
  'Developing Horse / Young Horse',
] as const;

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

export function defaultArenaFor(category: string, group: string): string {
  if (category === 'Sport Horse') return 'In-hand triangle, no rail letters';
  return GROUP_ARENA_DEFAULTS[`${category}::${group}`] ?? 'Standard, 20m x 60m';
}

export const DEFAULT_CLASS_FEE = 65;

export function groupsFor(
  category: CatalogCategory,
): { group: string; tests: readonly string[] }[] {
  return Object.entries(SM_HIERARCHY[category]).map(([group, tests]) => ({
    group,
    tests: tests as readonly string[],
  }));
}

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

export const CATALOG_DIVISIONS = ['Junior Rider', 'Adult Amateur', 'Open'] as const;

export const EVENT_SOURCE_BUTTONS = [
  '+ FEI',
  '+ USEF/USDF',
  '+ Independent',
  '+ Test of Choice (TOC)',
  '+ Add Custom Class',
] as const;

export const QUAL_TYPE_PRESETS = [
  { body: 'FEI', price: 20 },
  { body: 'USDF', price: 20 },
  { body: 'USEF', price: 20 },
] as const;

export const CONTACT_FIELDS = [
  { key: 'website', label: 'Website', type: 'url', placeholder: 'https://…' },
  { key: 'phone', label: 'Phone', type: 'tel', placeholder: '(555) 555-0100' },
  { key: 'contactEmail', label: 'Contact email', type: 'email', placeholder: 'info@yourshow.com' },
] as const;

export const VENDOR_SPACE_TEMPLATE = [
  { name: 'Indoor Vendor Space', price: 650 },
  { name: 'Truck & Trailer Location', price: 400 },
  { name: 'Courtyard Trailer Parking', price: 300 },
  { name: 'Tent (bring your own)', price: 250 },
  { name: 'Outside Arena Table Top', price: 200 },
  { name: 'Electricity Required (30 amp)', price: 25 },
  { name: 'Electricity Required (50 amp)', price: 50 },
] as const;

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
      {
        key: 'impulsion',
        label: 'Impulsion (desire to move forward, elasticity of steps)',
        coef: 1,
      },
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
      {
        key: 'impulsion',
        label: 'Impulsion (desire to move forward, elasticity of steps)',
        coef: 1,
      },
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
      {
        key: 'impulsion',
        label: 'Impulsion (desire to move forward, elasticity of steps)',
        coef: 1,
      },
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
      {
        key: 'impulsion',
        label: 'Impulsion (desire to move forward, elasticity of steps)',
        coef: 1,
      },
      { key: 'submission', label: 'Submission (attention, confidence, harmony)', coef: 1 },
      { key: 'rider', label: "Rider's position and seat", coef: 1 },
      { key: 'aids', label: "Rider's correct and effective use of aids", coef: 1 },
    ],
  },
] as const;

export const COGGINS_LABEL = 'Coggins';

export const HORSE_STAT_TINTS = {
  complete: { bg: '#DCEFE1', fg: '#2E7D46' },
  incomplete: { bg: '#F7E1E1', fg: '#B23A3A' },
  needsVerification: { bg: '#FCEBD2', fg: '#9A6A12' },
  cogginsExpired: { bg: '#F7E1E1', fg: '#B23A3A' },
  multiEntry: { bg: '#E3EDFB', fg: '#2E5FA8' },

  stallsOccupied: { bg: '#E4F0E8', fg: '#1A5B3C' },
} as const;

export const MAX_STABLES = 40;
export const MAX_STALLS_PER_STABLE = 300;

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

export const PNL_CATEGORY_ORDER = [
  'Entry Fees',
  'Add-ons & Stabling',
  'Vendor Items',
  'Merchandise',
  'Other',
] as const;

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

export const RIBBON_FALLBACK = { place: '', name: '', bg: '#E7EEE9', fg: '#1F3A2E' } as const;

export interface RibbonColor {
  name: string;
  bg: string;
  fg: string;
}

function placeLabel(index: number): string {
  return RIBBONS[index]?.place ?? `${String(index + 1)}th`;
}

export function ribbonFor(
  index: number,
  override?: RibbonColor[] | null,
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

export const SHOW_MANAGER_SECTIONS = [
  {
    label: 'Setup',
    path: '',
    nextLabel: 'Select Events',
    nextNote: 'Next: pick which classes this show is offering.',
  },
  {
    label: 'Select Events',
    path: '/select-events',
    nextLabel: 'Rider Entries',
    nextNote: 'Next: set up add-ons, vendor spaces, and qualifications for riders to purchase.',
  },
  {
    label: 'Rider Entries',
    path: '/rider-entries',
    nextLabel: 'Schedule / Review',
    nextNote: 'Next: review judges, per-class times, and arena assignments.',
  },
  {
    label: 'Schedule / Review',
    path: '/schedule',
    nextLabel: 'Run Show',
    nextNote:
      'Ticket sales and going live are handled from the lifecycle steps above — once ready, use "Open ticket sales" and "Approve schedule & go live" on Run Show.',
  },
  {
    label: 'Run Show',
    path: '/run-show',
    nextLabel: 'Documents',
    nextNote: 'Next: publish any files riders or staff need — prize lists, maps, forms.',
  },
  {
    label: 'Documents',
    path: '/documents',
    nextLabel: 'Test Builder',
    nextNote: 'Next: build or reuse the dressage tests this show will score against.',
  },
  {
    label: 'Test Builder',
    path: '/test-builder',
    nextLabel: 'Results',
    nextNote: 'Next: once scoring is confirmed, export final placings and scores.',
  },
  {
    label: 'Results',
    path: '/results',
    nextLabel: null,
    nextNote: null,
  },
] as const;

export type ShowManagerTab = (typeof SHOW_MANAGER_SECTIONS)[number]['label'];

export const DASHBOARD_PATH = '/dashboard';
export const SHOWS_PATH = '/dashboard/shows';
export const SCHEDULE_PATH = '/dashboard/schedule';
export const HORSES_PATH = '/dashboard/horses';
export const STABLE_CHART_PATH = '/dashboard/horses/stable-chart';

export const SHOW_DOCS_BUCKET = 'documents';

export const DEFAULT_SCHEDULE_PREFS = {
  perMin: 9,
  buffer: 2,
  upper: 2,
  end: '17:00',
  order: 'low',
  warmup: 'no',
  lunch: true,
  extraBreaks: 0,
  extraBreakMin: 10,
  hardRuleEnabled: true,
  hardRuleSameHorseMin: 30,
  hardRuleDiffHorseMin: 55,
  awardsByDivision: false,
} as const;

export const UPPER_LEVELS = new Set(['Third Level', 'Fourth Level', 'FEI']);

export const RING_SIZE_LABEL: Record<string, string> = {
  standard: 'Standard (20m × 60m)',
  small: 'Small (20m × 40m)',
};

export const SHOW_DETAILS_BODIES = ['FEI', 'USDF', 'USEF'] as const;
