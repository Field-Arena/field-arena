/**
 * How long an organizer owner invite stays valid, matching the Admin Console
 * design's own copy ("Invite expires in 14 days."). Shared by every place that
 * states or sets this number — the create mutation (invites.expires_at), the
 * Add Organizer dialog's footer, the Resend Invites button's tooltip, and its
 * success toast — so none of them can drift out of sync with each other the
 * way four separately hand-typed "14"s would.
 */
export const INVITE_TTL_DAYS = 14;

/**
 * SuperAdmin console navigation, ported from the button bar in the legacy
 * public/views/superadmin.html (lines 392-400). Labels and tooltips are carried
 * over so the console is recognisable to anyone who used the old one.
 *
 * Note: this flat list has no consumer anywhere in src/ — superadmin-shell.tsx
 * renders SUPERADMIN_SIDEBAR (grouped) and SUPERADMIN_TOOLS below instead.
 * "Signup Flow Preview" and "Demo" (legacy's two remaining button-bar entries)
 * are wired into SUPERADMIN_TOOLS, the list that's actually rendered.
 */
/**
 * Glyphs and tooltips are the legacy button bar's own, transcribed from the HTML
 * entities in superadmin.html lines 377-400 — ◆ for the home button, 💰 for
 * Sales Funnel, ▤ Scoring Catalog, 📁 Documents, 🧾 Billing, 👥 Users,
 * 👀 Signup Flow Preview, 🏆 Demo, ＋ Add Organizer, ✉ Resend Invite.
 *
 * `accent` marks the two buttons legacy styled gold (sa-cat-gold): Sales Funnel
 * and Add Organizer.
 */
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

/** Lead pipeline stages, matching the CHECK constraint on public.leads.status. */
export const LEAD_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'demo_scheduled', label: 'Demo scheduled' },
  { value: 'demo_completed', label: 'Demo completed' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'customer', label: 'Customer' },
  { value: 'lost', label: 'Lost' },
] as const;

/**
 * Which status maps to which badge tone. `customer` is the success state and
 * `lost` the terminal failure; everything between is in progress.
 */
export const LEAD_STATUS_TONE: Record<string, 'success' | 'warn' | 'danger' | 'info'> = {
  new: 'info',
  demo_scheduled: 'info',
  demo_completed: 'warn',
  onboarding: 'warn',
  customer: 'success',
  lost: 'danger',
};

/**
 * Sales-funnel status pill colours, transcribed exactly from the Admin Console
 * design's TARGET_PILL map. Each stage has a background, a foreground, and a dot.
 * These are the design's own hexes rather than the app's status tokens because
 * the funnel uses a warmer, six-step palette the generic status badge doesn't.
 */
export const LEAD_PILL: Record<string, { bg: string; fg: string; dot: string }> = {
  new: { bg: '#EDF5F1', fg: '#5A6B63', dot: '#9AA6A0' },
  demo_scheduled: { bg: '#F9F0D8', fg: '#8A6D14', dot: '#C9A227' },
  demo_completed: { bg: '#E6F1EA', fg: '#2E7048', dot: '#3E8E5A' },
  onboarding: { bg: '#E4EDE8', fg: '#0D2C23', dot: '#0D2C23' },
  customer: { bg: '#F6EAC8', fg: '#8A6D14', dot: '#C9A227' },
  lost: { bg: '#FCF1EF', fg: '#8E3627', dot: '#B4432F' },
};

/**
 * The onboarding checklist seeded onto a lead the first time its onboarding
 * email is sent, verbatim from the legacy ONBOARDING_CHECKLIST_TEMPLATE. Stored
 * per lead as [{id, label, done}] so a given org can drop items it doesn't need.
 */
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

/** Scoring-sheet families, matching the CHECK constraint on scoring_catalog.family. */
export const SHEET_FAMILIES = [
  'movement',
  'freestyle',
  'weighted',
  'placing',
  'unassigned',
] as const;

/**
 * Scoring-family display metadata for the catalog, transcribed from the Admin
 * Console design's FAM_STYLE plus the legacy FAMILIES blurbs. Each family has a
 * label, a one-line explanation of how it scores, and a badge colour triple.
 */
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

/** Score types (governing bodies) — the catalog's provenance filter. */
export const CATALOG_SCORE_TYPES = ['USEF', 'USDF', 'USEF/USDF', 'FEI', 'Independent'] as const;

/** Disciplines a catalog sheet can belong to, from the upload modal. */
export const CATALOG_DISCIPLINES = [
  'Dressage',
  'Western Dressage',
  'Eventing',
  'Hunter',
  'Jumper',
  'Combined Driving',
] as const;

/**
 * Console sidebar, grouped the way the Admin Console design groups it.
 *
 * Same destinations as SUPERADMIN_NAV above — that flat list still drives
 * anything that needs the console's routes without the grouping. The split
 * matters visually: "Clients" are the things a platform owner works *in*
 * (organizers, their people, the pipeline that creates them), while "Platform"
 * and "Tools" are configuration and one-off utilities. The design labels them
 * separately for that reason, so the grouping lives here rather than being
 * inferred in the component.
 */
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

/**
 * The two legacy button-bar entries (👀 Signup Flow Preview, 🏆 Demo) that
 * opened preview-signup-pages.html / preview-rider-demo.html in a new tab —
 * static walkthroughs of screens legacy hadn't ported yet. Now that all 6
 * signup/invite flows are real routes in this app, both link to the genuine
 * article instead of a mockup:
 *  - signup-preview → /dashboard/superadmin/preview, a step-through of all 6
 *    real routes (src/modules/superadmin/ui/signup-flow-preview.tsx).
 *  - demo-show → /rider/demo, the real rider flow's own demo mode
 *    (src/modules/riders/ui/rider-demo-walkthrough.tsx) — a riders-module
 *    route, not a SuperAdmin-side reimplementation, so there is only ever one
 *    copy of the rider signup screens to keep in sync.
 */
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
    reason: 'Rider signup, the wizard, checkout, and confirmation screen by screen — demo data throughout.',
  },
] as const;
