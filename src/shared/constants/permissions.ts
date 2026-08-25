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

  'canManageHoldingQueue',

  'canRefund',
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

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
