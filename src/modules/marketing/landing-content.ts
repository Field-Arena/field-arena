/**
 * Landing-page copy, verbatim from the design reference
 * (Field & Arena Landing.dc.html). It is the live site's copy, tightened — do
 * not paraphrase it while editing components.
 *
 * The grids are repetitive by design, so they live here as typed arrays the
 * sections map over rather than as hand-written markup twelve times.
 */
import { ROUTES } from '@/shared/constants/routes';

export const NAV_LINKS = [
  { label: 'Platform', href: '/#platform' },
  { label: 'Disciplines', href: '/#disciplines' },
  { label: 'Who it serves', href: '/#roles' },
  { label: 'How it works', href: '/#workflow' },
  { label: 'Learning Center', href: '/learning-center' },
] as const;

/**
 * Deep link that opens the demo dialog on load, for sharing and campaigns.
 *
 * In-page triggers do NOT use it — they render DemoTrigger, which flips the
 * store. The design's own `#demo` anchor only scrolled to the closing panel,
 * whose button pointed back at itself; a button labelled "Book a demo" has to
 * actually book one.
 *
 * None of these are pointed at /signup either. Booking a demo and creating an
 * account are different asks: self-service sign-up creates a rider, while
 * everyone these buttons address is a prospective organizer, invited after a
 * conversation. Sending them to a rider sign-up form would be the wrong door.
 */
export const DEMO_DEEP_LINK = '/?demo=1';
export const LOGIN_HREF = ROUTES.login;
export const SIGNUP_HREF = ROUTES.signup;

// ── Hero ───────────────────────────────────────────────────────────────────
export const HERO = {
  badge: 'Horse shows, finally connected',
  lead: 'Entries, payments, scheduling, officials, show-day operations, scoring, results, vendors, volunteers, and communication — connected in one system built for equestrian competition.',
  sub: 'Dressage to hunter/jumper, eventing to breed shows. Field & Arena adapts to the way your shows actually run.',
  frameLabel: 'Field & Arena · Live show operations',
  notes: [
    'Built for real show-day conditions',
    'Flexible scoring formats',
    'Role-based access',
    'Live operations and results',
  ],
  calloutCream: {
    eyebrow: 'Live show control',
    body: 'Arenas, rides, scratches, and staffing — all in one workspace.',
  },
  calloutGold: {
    eyebrow: 'One workflow',
    body: 'Organizer through published results.',
  },
} as const;

export const DISCIPLINE_MARQUEE = [
  'Dressage',
  'Western Dressage',
  'Hunter / Jumper',
  'Eventing',
  'Combined Training',
  'Quarter Horse',
  'Breed Shows',
  'Open & Schooling',
  'Multi-Discipline',
] as const;

// ── The problem ────────────────────────────────────────────────────────────
export const PROBLEM = {
  lead: 'Every discipline has its own rules, terminology, class structures, and scoring methods. But organizers across the sport face the same operational problems: scattered entries, complicated schedules, manual calculations, last-minute changes, delayed results, too many separate systems.',
  leadStrong:
    'Field & Arena gives every person the right information at the right time — from registration through final results.',
  cells: [
    {
      numeral: '01',
      title: 'No more disconnected registration',
      body: 'Collect horse, rider, owner, trainer, membership, document, stall, class, and payment information once — then use it all event long.',
    },
    {
      numeral: '02',
      title: 'No more spreadsheet overload',
      body: 'Classes, divisions, sections, schedules, officials, volunteers, vendors, communications, and finances stay connected.',
    },
    {
      numeral: '03',
      title: 'No more scoring bottlenecks',
      body: 'Tests, marks, percentages, points, times, faults, penalties, placings, ties, championships, and discipline-specific math.',
    },
    {
      numeral: '04',
      title: 'No more show-day confusion',
      body: 'Scratches, adds, class changes, ring status, orders of go, gate activity, and announcements from one live workspace.',
    },
  ],
} as const;

// ── Platform ───────────────────────────────────────────────────────────────
export const PLATFORM = {
  lead: 'Organizers, officials, staff, exhibitors, vendors, and volunteers each get a purpose-built workspace — while the underlying event data stays connected.',
  cards: [
    {
      numeral: '01',
      title: 'Entries and payments',
      body: 'Entries, class selections, add-ons, memberships, documents, waivers, stall requests, vendor registrations, and payments — without retyping the same information.',
    },
    {
      numeral: '02',
      title: 'Show setup and scheduling',
      body: 'Divisions, classes, sections, levels, arenas, rings, ride times, orders of go, schooling periods, officials, and staff assignments from one source of truth.',
    },
    {
      numeral: '03',
      title: 'Flexible scoring and placings',
      body: 'Test-based scoring, percentages, points, times, faults, penalties, judge cards, placings, ties, championships, and custom competition formats.',
    },
    {
      numeral: '04',
      title: 'Live show operations',
      body: 'Ring and arena activity, check-in, scratches, adds, conflicts, schedule changes, gate status, announcements, volunteers, and staff duties in real time.',
    },
    {
      numeral: '05',
      title: 'Results and communication',
      body: 'Publish verified results, placings, division standings, championship points, and score sheets — no paper results board to crowd around.',
    },
    {
      numeral: '06',
      title: 'Financial visibility',
      body: 'Entries, class fees, stalls, add-ons, vendor payments, refunds, payouts, outstanding balances, and show revenue — without stitching reports together.',
    },
  ],
} as const;

// ── Product tour ───────────────────────────────────────────────────────────
export const TOUR = {
  aside:
    'No mockups. This is the real organizer workspace, with live demo data standing in for yours.',
  chromeUrl: 'field-arena.com/organizer/dashboard',
  feature: {
    src: '/screenshots/organizer-dashboard.png',
    alt: 'Organizer dashboard showing live show stats, ring timers, and revenue',
    title: 'One dashboard, every show',
    body: 'Riders, entries, horses, vendors, and revenue — the whole event at a glance, updating live.',
  },
  secondary: [
    {
      src: '/screenshots/organizer-memberdatabase.png',
      alt: 'Member database showing thousands of searchable organization contacts',
      title: 'A contact database that remembers everyone',
      body: "Every judge, rider, vendor, and volunteer you've worked with — searchable across every show you run.",
    },
    {
      src: '/screenshots/organizer-showmanager.png',
      alt: 'ShowManager list of shows with live status indicators',
      title: 'Every competition in one place',
      body: 'See which shows are being built, accepting entries, in progress, awaiting results, or fully closed out.',
    },
  ],
} as const;

// ── Disciplines ────────────────────────────────────────────────────────────
export const DISCIPLINES = {
  lead: 'Shared operational needs, handled once. Each discipline keeps its own class structures, terminology, rules, and scoring workflows.',
  cards: [
    {
      title: 'Dressage & Western dressage',
      body: 'Tests, ride times, judges, scribes, movement scores, collective marks, comments, percentages, signatures, score sheets, and final standings.',
    },
    {
      title: 'Hunter, jumper & equitation',
      body: "Divisions and sections, orders of go, judges' cards, times, faults, scores, callbacks, placings, championships, and reserve championships.",
    },
    {
      title: 'Eventing & combined training',
      body: 'Connect dressage, cross-country, and stadium phases while calculating penalties, tracking eliminations, resolving ties, and producing overall standings.',
    },
    {
      title: 'Quarter Horse & breed shows',
      body: 'Breed-specific divisions, exhibitors, horses, owners, classes, judges, placings, points, circuit awards, high-point standings, and multi-judge results.',
    },
    {
      title: 'Open, schooling & multi-discipline',
      body: 'Flexible class structures and scoring formats for local associations, riding clubs, barns, schooling series, and events combining several disciplines.',
    },
  ],
  ctaCard: {
    title: "Don't see yours?",
    body: "Class structures and scoring are configurable. Tell us how your discipline competes and we'll walk you through it.",
    link: 'Book a demo',
  },
} as const;

// ── Roles ──────────────────────────────────────────────────────────────────
export const ROLES = [
  {
    title: 'Organizers & administrators',
    body: 'Build the event and manage entries, classes, rings, officials, schedules, finances, communications, vendors, volunteers, and show-day operations.',
  },
  {
    title: 'Judges & officials',
    body: 'Assignments plus the correct judging interface for the discipline — tests, scorecards, marks, comments, times, faults, penalties, placings, verification.',
  },
  {
    title: 'Secretaries & office staff',
    body: 'Review entries, documents, payments, changes, schedules, scoring, standings, results, awards, and reconciliation from one workspace.',
  },
  {
    title: 'Gate staff, ring crews & announcers',
    body: 'Follow the live order of go, record arrivals and scratches, track ring progress, communicate changes, and keep competition moving.',
  },
  {
    title: 'Riders, exhibitors, owners & trainers',
    body: 'Discover shows, enter horses, select classes, submit documents, pay, receive updates, view schedules, and follow results from one account.',
  },
  {
    title: 'Vendors, volunteers & sponsors',
    body: 'Register, receive assignments and event information, manage requirements, and stay connected before and during the show.',
  },
] as const;

// ── Workflow ───────────────────────────────────────────────────────────────
export const WORKFLOW = [
  {
    step: '1',
    title: 'Build the show',
    body: 'Create the structure around your discipline: divisions, classes, sections, levels, tests, patterns, rings, fees, officials, documents, awards, and requirements.',
  },
  {
    step: '2',
    title: 'Accept entries',
    body: 'Collect accurate information once, then use it automatically for schedules, orders of go, scoring, communications, payments, and results.',
  },
  {
    step: '3',
    title: 'Run it live',
    body: 'Give each role a clear workspace while ring activity, changes, scoring, placings, and communications stay connected.',
  },
  {
    step: '4',
    title: 'Publish & reconcile',
    body: 'Release results and standings, distribute score sheets, finalize awards and payments, export reports, and close with a complete digital record.',
  },
] as const;

// ── Benefits ───────────────────────────────────────────────────────────────
export const BENEFITS = {
  lead: 'Designed to cut repeated data entry and give organizers a clearer operational picture — without forcing officials, staff, volunteers, or exhibitors to learn an enterprise system.',
  metrics: [
    { label: 'Repeated entry of horse and exhibitor information', value: 'Reduced' },
    { label: 'Manual score and placing calculations', value: 'Automated' },
    { label: 'Visibility across rings and arenas', value: 'Live' },
    { label: 'Results and standings', value: 'Immediate' },
  ],
  quote:
    '“The organizer should know what is happening, the staff should know what to do, the official should have the correct tools, and the exhibitor should not have to wait hours for information.”',
  quoteCaption: 'Field & Arena product principle',
} as const;

// ── Final CTA ──────────────────────────────────────────────────────────────
export const FINAL_CTA = {
  lead: "We'll tailor the walkthrough to your discipline, competition format, event size, and current process.",
  finePrint: "No setup fee to look. Bring a past show and we'll build it live.",
} as const;

// ── Footer ─────────────────────────────────────────────────────────────────
export const FOOTER = {
  blurb:
    'Modern infrastructure for planning, operating, scoring, and growing equestrian competitions across disciplines.',
  copyright: '© 2026 Field & Arena. All rights reserved.',
  columns: [
    {
      heading: 'Platform',
      links: [
        { label: 'Overview', href: '/#platform' },
        { label: 'Disciplines', href: '/#disciplines' },
        { label: 'How it works', href: '/#workflow' },
        { label: 'Roles', href: '/#roles' },
      ],
    },
    {
      heading: 'Learning Center',
      links: [
        { label: 'All guides', href: '/learning-center' },
        { label: 'Scoring software', href: '/learning/horse-show-scoring-software' },
        { label: 'Dressage', href: '/learning/dressage-show-software' },
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'About', href: '/#top' },
        { label: 'Terms of Service', href: '/terms-of-service' },
        { label: 'Privacy Policy', href: '/privacy-policy' },
      ],
    },
    {
      heading: 'Get started',
      links: [
        { label: 'Create an account', href: ROUTES.signup },
        { label: 'Log in', href: ROUTES.login },
      ],
    },
  ],
} as const;

// ── Book a demo ────────────────────────────────────────────────────────────
/**
 * The demo-request form's two closed lists. Kept closed rather than free text so
 * the Sales Funnel can group leads without normalising typed answers later.
 */
export const DEMO_DISCIPLINES = [
  'Dressage',
  'Western Dressage',
  'Hunter / Jumper',
  'Eventing',
  'Combined Training',
  'Quarter Horse',
  'Breed Shows',
  'Open & Schooling',
  'Multi-Discipline',
  'Other',
] as const;

export const DEMO_VOLUMES = ['1–3', '4–10', '11–25', '26–50', 'More than 50'] as const;

/**
 * Shows-per-year stored on the lead, keyed by the range the visitor picked.
 *
 * The lead table holds an integer, the form asks a range. The LOW end of each
 * range is stored: it is the only figure the answer actually guarantees, so
 * pipeline sizing built on it under-promises rather than over-promises. The
 * chosen label is written to notes as well, so nothing is lost.
 */
export const DEMO_VOLUME_TO_SHOWS: Record<string, number> = {
  '1–3': 1,
  '4–10': 4,
  '11–25': 11,
  '26–50': 26,
  'More than 50': 50,
};
