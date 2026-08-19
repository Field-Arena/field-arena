export const INVITE_TTL_DAYS = 14;

export const SUPERADMIN_NAV = [
  {
    key: 'overview',
    glyph: '◆',
    label: 'Super Admin',
    href: '/dashboard/superadmin',
    hint: 'Super Admin home',
    accent: false,
  },
  {
    key: 'sales',
    glyph: '💰',
    label: 'Sales Funnel',
    href: '/dashboard/superadmin/sales',
    hint: 'Sales Funnel — master lead list, demos, and onboarding',
    accent: true,
  },
  {
    key: 'catalog',
    glyph: '▤',
    label: 'Scoring Catalog',
    href: '/dashboard/superadmin/catalog',
    hint: 'Scoring Catalog',
    accent: false,
  },
  {
    key: 'documents',
    glyph: '📁',
    label: 'Documents',
    href: '/dashboard/superadmin/documents',
    hint: 'Documents',
    accent: false,
  },
  {
    key: 'billing',
    glyph: '🧾',
    label: 'Billing',
    href: '/dashboard/superadmin/billing',
    hint: 'Billing',
    accent: false,
  },
  {
    key: 'users',
    glyph: '👥',
    label: 'Users',
    href: '/dashboard/superadmin/users',
    hint: 'Users',
    accent: false,
  },
] as const;

export const LEAD_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'demo_scheduled', label: 'Demo scheduled' },
  { value: 'demo_completed', label: 'Demo completed' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'customer', label: 'Customer' },
  { value: 'lost', label: 'Lost' },
] as const;

export const LEAD_STATUS_TONE: Record<string, 'success' | 'warn' | 'danger' | 'info'> = {
  new: 'info',
  demo_scheduled: 'info',
  demo_completed: 'warn',
  onboarding: 'warn',
  customer: 'success',
  lost: 'danger',
};

export const LEAD_PILL: Record<string, { bg: string; fg: string; dot: string }> = {
  new: { bg: '#EDF5F1', fg: '#5A6B63', dot: '#9AA6A0' },
  demo_scheduled: { bg: '#F9F0D8', fg: '#8A6D14', dot: '#C9A227' },
  demo_completed: { bg: '#E6F1EA', fg: '#2E7048', dot: '#3E8E5A' },
  onboarding: { bg: '#E4EDE8', fg: '#0D2C23', dot: '#0D2C23' },
  customer: { bg: '#F6EAC8', fg: '#8A6D14', dot: '#C9A227' },
  lost: { bg: '#FCF1EF', fg: '#8E3627', dot: '#B4432F' },
};

export const ONBOARDING_CHECKLIST_TEMPLATE = [
  'Staff list — names, emails, and roles for everyone helping run the show',
  'Prize list',
  "Waiver — let us know if you'll use our standard waiver or want to provide your own",
  'Add-ons and pricing — stalls, shavings, and anything else riders can add to their entry',
  'Vendor spaces and pricing',
  'Venue details — full address and any access notes',
  'Stabling — how many stalls and how many barns',
  'Ticket pricing, and whether this is a qualifying/rated show or a schooling show',
] as const;

export const SHEET_FAMILIES = [
  'movement',
  'freestyle',
  'weighted',
  'placing',
  'unassigned',
] as const;

export const CATALOG_FAMILY_META: Record<
  string,
  { label: string; blurb: string; bg: string; fg: string; bd: string }
> = {
  movement: {
    label: 'Movement test',
    blurb: 'Numbered movements × coefficient + collectives − errors → %',
    bg: '#EDF5F1',
    fg: '#2E7048',
    bd: '#D3E6DA',
  },
  freestyle: {
    label: 'Freestyle',
    blurb: 'Technical + Artistic panels → %',
    bg: '#F6EAC8',
    fg: '#8A6D14',
    bd: '#EBDCAF',
  },
  weighted: {
    label: 'Weighted / 100',
    blurb: 'Scored category sections summed toward 100',
    bg: '#F3EEF6',
    fg: '#6B4E8A',
    bd: '#E6DAF0',
  },
  placing: {
    label: 'Placing',
    blurb: 'Rank-only — horses placed against each other',
    bg: '#E8EFF6',
    fg: '#2F5A87',
    bd: '#D3E1EE',
  },
  unassigned: {
    label: 'Unassigned',
    blurb: 'Scoring family not yet confirmed',
    bg: '#F1F3F2',
    fg: '#7A8781',
    bd: '#E2E8E4',
  },
};

export const CATALOG_SCORE_TYPES = ['USEF', 'USDF', 'USEF/USDF', 'FEI', 'Independent'] as const;

export const GOVERNING_BODIES = ['FEI', 'USDF', 'USEF'] as const;

export const CATALOG_DISCIPLINES = [
  'Dressage',
  'Western Dressage',
  'Eventing',
  'Hunter',
  'Jumper',
  'Combined Driving',
] as const;

export const SUPERADMIN_SIDEBAR = [
  {
    heading: 'Clients',
    items: [
      { key: 'overview', label: 'Organizers', href: '/dashboard/superadmin', icon: 'organizers' },
      { key: 'users', label: 'Users', href: '/dashboard/superadmin/users', icon: 'users' },
      { key: 'sales', label: 'Sales Funnel', href: '/dashboard/superadmin/sales', icon: 'funnel' },
    ],
  },
  {
    heading: 'Platform',
    items: [
      {
        key: 'catalog',
        label: 'Scoring catalog',
        href: '/dashboard/superadmin/catalog',
        icon: 'catalog',
      },
      {
        key: 'documents',
        label: 'Documents',
        href: '/dashboard/superadmin/documents',
        icon: 'documents',
      },
      { key: 'billing', label: 'Billing', href: '/dashboard/superadmin/billing', icon: 'billing' },
    ],
  },
] as const;

export const CONSOLE_PATH = '/dashboard/superadmin';
export const USERS_PATH = '/dashboard/superadmin/users';
export const SALES_PATH = '/dashboard/superadmin/sales';
export const CATALOG_PATH = '/dashboard/superadmin/catalog';
export const DOCUMENTS_PATH = '/dashboard/superadmin/documents';
export const DOCS_BUCKET = 'catalog-docs';

export const SUPERADMIN_TOOLS = [
  {
    key: 'signup-preview',
    label: 'Signup flow preview',
    icon: 'preview',
    href: '/dashboard/superadmin/preview',
    reason: 'Step through every signup and invite page, role by role.',
  },
  {
    key: 'demo-show',
    label: 'Demo show',
    icon: 'demo',
    href: '/rider/demo',
    reason:
      'Rider signup, the wizard, checkout, and confirmation screen by screen — demo data throughout.',
  },
] as const;
