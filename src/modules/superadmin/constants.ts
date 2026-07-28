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
