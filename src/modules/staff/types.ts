import type { PermissionKey } from '@/shared/constants/permissions';

export type UserDirectoryKind = 'staff' | 'rider' | 'vendor';

export type UserDirectoryStatus = 'not_invited' | 'pending' | 'onboard';

export interface CogginsStatus {
  applicable: boolean;

  compliant: boolean | null;
  reason: 'not_applicable' | 'missing' | 'expired' | 'unverified' | 'compliant';
  expirationDate: string | null;
  /* Whether it's been checked off as verified, independent of `reason` — an
   * expired document can still have been verified at some point, and that
   * fact would otherwise be invisible once `reason` settles on 'expired'. */
  verified: boolean;
}

export interface UserDirectoryRow {
  key: string;
  kind: UserDirectoryKind;

  id: string;
  name: string;

  firstName: string | null;
  lastName: string | null;

  role: string;
  email: string | null;
  phone: string | null;
  showId: string;
  showName: string;
  status: UserDirectoryStatus;
  isSteward: boolean;
  canScratchSkipDq: boolean;
  canViewMoney: boolean;

  permissions: Record<PermissionKey, boolean> | null;

  coggins: CogginsStatus | null;

  editable: boolean;

  riderDetail: RiderDetail | null;
  vendorDetail: VendorDetail | null;
}

export interface RiderDetailDocument {
  requirementId: string;
  label: string;
  requiresApproval: boolean;
  uploaded: boolean;
  verified: boolean | null; // null when the requirement doesn't need approval
  expirationDate: string | null;
  pastDue: boolean;
}

export interface RiderDetailHorse {
  id: string;
  name: string;
  documents: RiderDetailDocument[];
}

export interface RiderDetail {
  riderId: string | null; // null when this row has no real linked account to edit
  horses: RiderDetailHorse[];
  classes: { label: string; fee: number }[];
  addOns: { label: string; qty: number; amount: number }[];
}

export interface VendorDetail {
  items: { label: string; qty: number; unitPrice: number; amount: number }[];
  total: number;
}

export interface RingCoverageData {
  /* Distinct classes.location/arena values for the show — not a separately
   * managed list, see the query that builds this. */
  rings: string[];
  /* ring name -> the staff_assignments.id covering it, or null when unassigned. */
  assignments: Record<string, string | null>;
}
