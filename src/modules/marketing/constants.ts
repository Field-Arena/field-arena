export const NAV_LINKS = [
  { label: 'Platform', href: '#platform' },
  { label: 'Disciplines', href: '#disciplines' },
  { label: 'Who it serves', href: '#roles' },
  { label: 'How it works', href: '#workflow' },
] as const;

export const DISCIPLINE_CHIPS = [
  'Dressage',
  'Western Dressage',
  'Hunter/Jumper',
  'Eventing',
  'Combined Training',
  'Quarter Horse',
  'Breed Shows',
  'Open and Schooling Shows',
  'Multi-Discipline Events',
] as const;

export const HERO_NOTES = [
  'Built for real show-day conditions',
  'Flexible competition and scoring formats',
  'Role-based access',
  'Live operations and results',
] as const;

export const PROBLEMS = [
  {
    icon: 'registration',
    title: 'No more disconnected registration',
    body: 'Collect horse, rider, owner, trainer, membership, document, stall, class, and payment information once, then use it throughout the event.',
  },
  {
    icon: 'spreadsheet',
    title: 'No more spreadsheet overload',
    body: 'Keep classes, divisions, sections, schedules, officials, volunteers, vendors, communications, and finances connected.',
  },
  {
    icon: 'target',
    title: 'No more manual scoring bottlenecks',
    body: 'Support tests, marks, percentages, points, times, faults, penalties, placings, ties, championships, and discipline-specific calculations.',
  },
  {
    icon: 'pin',
    title: 'No more show-day confusion',
    body: 'Manage scratches, adds, class changes, ring status, orders of go, gate activity, announcements, staff responsibilities, and schedule updates from one live workspace.',
  },
] as const;

export const PLATFORM_FEATURES = [
  {
    number: '01',
    title: 'Entries and payments',
    body: 'Accept entries, class selections, add-ons, memberships, documents, waivers, stall requests, vendor registrations, and payments without repeatedly entering the same information.',
  },
  {
    number: '02',
    title: 'Show setup and scheduling',
    body: 'Create divisions, classes, sections, levels, arenas, rings, ride times, orders of go, schooling periods, officials, staff assignments, and operating plans from one source of truth.',
  },
  {
    number: '03',
    title: 'Flexible scoring and placings',
    body: 'Manage test-based scoring, percentages, points, times, faults, penalties, rankings, judge cards, placings, ties, championships, and custom competition formats.',
  },
  {
    number: '04',
    title: 'Live show operations',
    body: 'Track ring and arena activity, check-in, scratches, adds, conflicts, schedule changes, gate status, announcements, volunteers, and staff responsibilities in real time.',
  },
  {
    number: '05',
    title: 'Results, standings, and communication',
    body: 'Publish verified results, class placings, division standings, championship points, score sheets, times, and updates without making exhibitors search for a paper results board.',
  },
  {
    number: '06',
    title: 'Financial visibility',
    body: 'Understand entries, class fees, stalls, add-ons, vendor payments, refunds, payouts, outstanding balances, and show revenue without stitching reports together.',
  },
] as const;

export const SHOWCASE = [
  {
    image: '/screenshots/organizer-dashboard.png',
    alt: 'Organizer dashboard showing live show stats, ring timers, and revenue',
    title: 'One dashboard, every show',
    body: 'Riders, entries, horses, vendors, and revenue — the whole event at a glance, updating live.',
  },
  {
    image: '/screenshots/organizer-memberdatabase.png',
    alt: 'Member database showing thousands of searchable organization contacts',
    title: 'A contact database that remembers everyone',
    body: "Every judge, rider, vendor, and volunteer you've ever worked with — searchable across every show you run.",
  },
  {
    image: '/screenshots/organizer-showmanager.png',
    alt: 'ShowManager list of shows with live status indicators',
    title: 'Every competition in one place',
    body: 'See which shows are being built, accepting entries, in progress, awaiting results, or fully closed out.',
  },
] as const;

export const DISCIPLINES = [
  {
    icon: 'clipboard-check',
    title: 'Dressage and Western dressage',
    body: 'Manage tests, ride times, judges, scribes, movement scores, collective marks, comments, percentages, signatures, score sheets, and final standings.',
  },
  {
    icon: 'jump',
    title: 'Hunter, jumper, and equitation',
    body: 'Build divisions and sections, manage orders of go, record judges’ cards, times, faults, scores, callbacks, placings, championships, and reserve championships.',
  },
  {
    icon: 'flag',
    title: 'Eventing and combined training',
    body: 'Connect dressage, cross-country, and stadium phases while calculating penalties, tracking eliminations, resolving ties, and producing overall standings.',
  },
  {
    icon: 'star',
    title: 'Quarter Horse and breed shows',
    body: 'Manage breed-specific divisions, exhibitors, horses, owners, classes, judges, placings, points, circuit awards, high-point standings, and multi-judge results.',
  },
  {
    icon: 'grid',
    title: 'Open, schooling, and multi-discipline shows',
    body: 'Create flexible class structures and scoring formats for local associations, riding clubs, barns, schooling series, open shows, and events that combine multiple disciplines.',
  },
] as const;

export const WORKSPACE = [
  {
    icon: 'database',
    title: 'A contact database that remembers everyone',
    body: 'Keep riders, exhibitors, horses, owners, trainers, officials, vendors, volunteers, sponsors, and staff searchable across every event you operate.',
  },
  {
    icon: 'calendar',
    title: 'Every competition in one place',
    body: 'See which shows are being built, accepting entries, in progress, awaiting results, or fully closed out.',
  },
  {
    icon: 'copy',
    title: 'Reusable show structures',
    body: 'Duplicate common classes, divisions, fees, documents, officials, schedules, and operational settings instead of rebuilding every event from scratch.',
  },
] as const;

export const ROLES = [
  {
    icon: 'briefcase',
    title: 'Organizers and show administrators',
    body: 'Build the event and manage entries, classes, rings, officials, schedules, finances, communications, vendors, volunteers, and show-day operations.',
  },
  {
    icon: 'check',
    title: 'Judges and officials',
    body: 'Access assignments and the correct judging interface for the discipline, including tests, scorecards, marks, comments, times, faults, penalties, placings, and verification.',
  },
  {
    icon: 'clipboard',
    title: 'Show secretaries and office staff',
    body: 'Review entries, documents, payments, changes, schedules, scoring, standings, results, awards, and reconciliation from one connected workspace.',
  },
  {
    icon: 'megaphone',
    title: 'Gate staff, ring crews, and announcers',
    body: 'Follow the live order of go, record arrivals and scratches, track ring progress, communicate changes, and keep competition moving.',
  },
  {
    icon: 'user',
    title: 'Riders, exhibitors, owners, and trainers',
    body: 'Discover shows, enter horses, select classes, submit documents, pay, manage participation, receive updates, view schedules, and follow results from one account.',
  },
  {
    icon: 'store',
    title: 'Vendors, volunteers, and sponsors',
    body: 'Register, receive assignments and event information, manage requirements, and stay connected before and during the show.',
  },
] as const;

export const WORKFLOW_STEPS = [
  {
    title: 'Build the show',
    body: 'Create the event structure around your discipline: divisions, classes, sections, levels, tests, patterns, rings, fees, officials, documents, awards, and registration requirements.',
  },
  {
    title: 'Accept and organize entries',
    body: 'Collect accurate information once and automatically use it for schedules, orders of go, scoring, communications, payments, and results.',
  },
  {
    title: 'Run the event live',
    body: 'Give each role a clear workspace while ring activity, changes, scoring, placings, and communications remain connected.',
  },
  {
    title: 'Publish and reconcile',
    body: 'Release results and standings, distribute score sheets, finalize awards and payments, export reports, and close the event with a complete digital record.',
  },
] as const;

export const BENEFIT_METRICS = [
  { label: 'Repeated entry of horse and exhibitor information', value: 'Reduced' },
  { label: 'Manual score and placing calculations', value: 'Automated where applicable' },
  { label: 'Visibility across rings and arenas', value: 'Live' },
  { label: 'Results and standings', value: 'Faster and easier to access' },
] as const;

export const FOOTER_COLUMNS = [
  {
    heading: 'Platform',
    links: [
      { label: 'Overview', href: '#platform' },
      { label: 'Disciplines', href: '#disciplines' },
      { label: 'How it works', href: '#workflow' },
      { label: 'Roles', href: '#roles' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Contact', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Privacy Policy', href: '#' },
    ],
  },
  {
    heading: 'Get started',
    links: [
      { label: 'Book a demo', href: '#demo' },
      { label: 'Log in', href: '/login' },
      { label: 'Support', href: '#' },
    ],
  },
] as const;
