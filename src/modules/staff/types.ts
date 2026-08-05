import type { PermissionKey } from '@/shared/constants/permissions';

/**
 * The org-wide "All Users" directory — a 3-way union of staff_assignments,
 * riders actually entered per show, and vendor bookings. See
 * `allUsersAcrossShows()` in the legacy showstaff.html (~line 9522) for the
 * behaviour this ports; `data/queries.ts`'s `listAllUsersAcrossShows` builds
 * it against the real schema.
 */
export type UserDirectoryKind = 'staff' | 'rider' | 'vendor';

/**
 * Not a stored column — staff_assignments.status is only ever 'pending' |
 * 'accepted' in this schema, and riders/vendors have no invite state at all.
 * This is a UX-facing derived tri-state, resolved per kind in the query layer:
 * see listAllUsersAcrossShows's doc comment for exactly how each kind maps.
 */
export type UserDirectoryStatus = 'not_invited' | 'pending' | 'onboard';

export interface CogginsStatus {
  /** False when there is no horse record or no Coggins requirement on this show to check against — a rider cannot be non-compliant with a requirement that doesn't apply to them. */
  applicable: boolean;
  /** Null when not applicable. */
  compliant: boolean | null;
  reason: 'not_applicable' | 'missing' | 'expired' | 'unverified' | 'compliant';
  expirationDate: string | null;
}

export interface UserDirectoryRow {
  /** Stable per-row key for React and for row-click targets. */
  key: string;
  kind: UserDirectoryKind;
  /** The underlying row id — staff_assignments.id, riders.id (or a synthetic key for a roster-only rider), or vendor_bookings.id. */
  id: string;
  name: string;
  /** staff kind only — null for rider/vendor rows, whose name has no first/last split in this directory. */
  firstName: string | null;
  lastName: string | null;
  /** Human role label: a staff_assignments.role value, 'Rider', or 'Vendor'. */
  role: string;
  email: string | null;
  phone: string | null;
  showId: string;
  showName: string;
  status: UserDirectoryStatus;
  isSteward: boolean;
  canScratchSkipDq: boolean;
  canViewMoney: boolean;
  /** Resolved permissions (role defaults + explicit grants) — staff kind only. */
  permissions: Record<PermissionKey, boolean> | null;
  /** Rider kind only; null for staff/vendor rows. */
  coggins: CogginsStatus | null;
  /** Whether this row has a real, editable staff_assignments record — false for riders and vendors, whose edit surface (if any) lives elsewhere. */
  editable: boolean;
}
