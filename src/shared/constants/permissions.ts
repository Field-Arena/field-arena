/**
 * Per-person, per-show staff permissions.
 *
 * IMPORTANT: this mirrors public.has_show_permission() in
 * supabase/migrations/20260727120900_rls.sql. Postgres is the security boundary;
 * anything here is a UX optimization that hides controls the user cannot use.
 * If the two disagree, the database wins and the UI shows a button that errors.
 * Change both together.
 *
 * The Organizer and SuperAdmin are never staff_assignments rows, so they hold
 * every permission implicitly and never reach this table.
 */
export const PERMISSION_KEYS = [
  'canScratch',
  'canSkip',
  'canEliminate',
  'canViewMoney',
  'canEditShow',
  'canManageStaff',
  'canManageVendors',
  'canApproveDocuments',
  'canEnterScores',
  'canPublishShow',
  'canExportRoster',
  /** Adding a rider outside the built schedule, and working one in mid-class. */
  'canManageHoldingQueue',
  /**
   * Separate from canViewMoney on purpose: seeing financial data and actually
   * pulling money back out through Stripe are different levels of trust.
   * Defaults to false for every role including Show Admin, and is never implied
   * by any other permission.
   */
  'canRefund',
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

/**
 * Per-role starting point. An explicit per-person grant always overrides these.
 *
 * Show Admin defaults to "everything except money": it is modelled as
 * organizer-equivalent for operational actions on its one show, but financial
 * visibility and refund authority must be granted per person, exactly as for any
 * other role. Judge and Scribe both get the three ride-day actions plus score
 * entry, since either may be the one actually typing while the other calls
 * marks out.
 */
export const ROLE_PERMISSION_DEFAULTS: Record<string, Partial<Record<PermissionKey, boolean>>> = {
  'Show Admin': {
    canScratch: true,
    canSkip: true,
    canEliminate: true,
    canEditShow: true,
    canManageStaff: true,
    canManageVendors: true,
    canApproveDocuments: true,
    canEnterScores: true,
    canPublishShow: true,
    canExportRoster: true,
    canManageHoldingQueue: true,
  },
  Judge: { canScratch: true, canSkip: true, canEliminate: true, canEnterScores: true },
  Scribe: { canScratch: true, canSkip: true, canEliminate: true, canEnterScores: true },
  Announcer: {},
  ShowStaff: {},
  Vendor: {},
};

/** Human labels for the per-user permission editor. */
export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  canScratch: 'Scratch a ride',
  canSkip: 'Skip a ride',
  canEliminate: 'Disqualify a ride',
  canViewMoney: 'View financial data',
  canEditShow: 'Edit show setup',
  canManageStaff: 'Manage staff',
  canManageVendors: 'Manage vendors',
  canApproveDocuments: 'Approve documents',
  canEnterScores: 'Enter scores',
  canPublishShow: 'Publish the show',
  canExportRoster: 'Export the roster',
  canManageHoldingQueue: 'Manage the holding queue',
  canRefund: 'Issue refunds',
};
