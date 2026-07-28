/**
 * SuperAdmin console navigation, ported from the button bar in the legacy
 * public/views/superadmin.html (lines 392-400). Labels and tooltips are carried
 * over so the console is recognisable to anyone who used the old one.
 *
 * Two legacy buttons are intentionally absent. "Signup Flow Preview" and "Demo"
 * opened preview-signup-pages.html and preview-rider-demo.html in a new tab —
 * static walkthroughs of screens that, in this codebase, are becoming real
 * routes. Once the rider and invite flows are migrated they can be visited
 * directly, so a preview harness for them would be a copy to keep in sync.
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

/** Scoring-sheet families, matching the CHECK constraint on scoring_catalog.family. */
export const SHEET_FAMILIES = [
  'movement',
  'freestyle',
  'weighted',
  'placing',
  'unassigned',
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
 * Sidebar entries the design shows but this build cannot honour yet.
 *
 * Rendered disabled with the reason on hover rather than omitted: the legacy
 * console had both, and silently dropping them makes the console look like it
 * lost features. Both were static walkthroughs (preview-signup-pages.html,
 * preview-rider-demo.html) of screens that are becoming real routes here, so
 * rebuilding them as previews would mean maintaining a second copy of every
 * signup screen.
 */
export const SUPERADMIN_TOOLS = [
  {
    key: 'signup-preview',
    label: 'Signup flow preview',
    icon: 'preview',
    reason:
      'Step through every signup and invite page. The legacy preview was a static walkthrough of screens that are becoming real routes here.',
  },
  {
    key: 'demo-show',
    label: 'Demo show',
    icon: 'demo',
    reason:
      'Rider signup, the wizard, checkout, and confirmation screen by screen. The legacy Demo page was a static walkthrough of those same screens.',
  },
] as const;
