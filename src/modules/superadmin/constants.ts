/* Supabase Auth's invite links expire after 7 days by default, which is also
 * what the legacy invites table used (INVITE_TTL_MS in api/_lib/invites.js).
 * This constant is display copy only — it enforces nothing, so it must track
 * the provider setting rather than lead it. */
export const INVITE_TTL_DAYS = 7;

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
  new: { bg: '#EAF5EF', fg: '#475467', dot: '#8A94A3' },
  demo_scheduled: { bg: '#FDF2E3', fg: '#B45309', dot: '#146A47' },
  demo_completed: { bg: '#E7F6EE', fg: '#15794F', dot: '#146A47' },
  onboarding: { bg: '#EEF1F4', fg: '#101828', dot: '#101828' },
  customer: { bg: '#FDF2E3', fg: '#B45309', dot: '#146A47' },
  lost: { bg: '#FEF3F2', fg: '#B42318', dot: '#B42318' },
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
    bg: '#EAF5EF',
    fg: '#15794F',
    bd: '#CFE9DB',
  },
  freestyle: {
    label: 'Freestyle',
    blurb: 'Technical + Artistic panels → %',
    bg: '#FDF2E3',
    fg: '#B45309',
    bd: '#F6DCB8',
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
    bg: '#EEF1F4',
    fg: '#8A94A3',
    bd: '#E7EAEE',
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

// Grouped as the redesign's console sidebar (field-arena-prototype/superadmin.html).
export const SUPERADMIN_SIDEBAR = [
  {
    heading: 'Platform',
    items: [
      { key: 'overview', label: 'Overview', href: '/dashboard/superadmin', icon: 'overview' },
      {
        key: 'organizers',
        label: 'Organizers',
        href: '/dashboard/superadmin/organizers',
        icon: 'organizers',
      },
      {
        key: 'catalog',
        label: 'Scoring Catalog',
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
      { key: 'users', label: 'Users', href: '/dashboard/superadmin/users', icon: 'users' },
    ],
  },
  {
    heading: 'Growth',
    items: [
      {
        key: 'signup-preview',
        label: 'Signup Flow',
        href: '/dashboard/superadmin/preview',
        icon: 'preview',
      },
      { key: 'sales', label: 'Sales Funnel', href: '/dashboard/superadmin/sales', icon: 'funnel' },
    ],
  },
] as const;

export const CONSOLE_PATH = '/dashboard/superadmin';
export const ORGANIZERS_PATH = '/dashboard/superadmin/organizers';
export const USERS_PATH = '/dashboard/superadmin/users';
export const SALES_PATH = '/dashboard/superadmin/sales';
export const CATALOG_PATH = '/dashboard/superadmin/catalog';
export const DOCUMENTS_PATH = '/dashboard/superadmin/documents';
export const DOCS_BUCKET = 'catalog-docs';

export const SUPERADMIN_TOOLS = [
  {
    key: 'demo-show',
    label: 'Demo show',
    icon: 'demo',
    href: '/rider/demo',
    reason:
      'Rider signup, the wizard, checkout, and confirmation screen by screen — demo data throughout.',
  },
] as const;
