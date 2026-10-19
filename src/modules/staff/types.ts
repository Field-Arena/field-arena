import type { PermissionKey } from '@/shared/constants/permissions';
import type { StaffProfile } from '@/shared/types/auth';
import type { ShowListItem } from '@/modules/shows/types';

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
  /** Judge licence / rating (e.g. USEF "S"); staff rows only. */
  license: string | null;
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

export interface MemberOrg {
  orgId: string;
  orgName: string;
  /** Workspace keys this org is relevant under — e.g. a person staffed as
   * Judge in one org and Show Admin in another gets that org tagged with
   * only the role that actually applies there. Lets the switcher (and the
   * multi-role rail) show only orgs that belong to the workspace currently
   * open, instead of every org this identity touches under any role. */
  roles: string[];
}

/** Suspended/deleted orgs the signed-in staff user is tied to. `allBlocked`
 * is set only when every one of their orgs is closed, and says why. */
export interface OrgAccessBlock {
  blockedOrgIds: string[];
  allBlocked: 'suspended' | 'deleted' | null;
}

export interface OrganizerContext {
  profile: StaffProfile;
  orgId: string | null;
  orgName: string;
  shows: ShowListItem[];
  currentShow: ShowListItem | null;
  canViewMoney: boolean;

  impersonating: boolean;

  previewingAsShowAdmin: boolean;

  memberOrgs: MemberOrg[];
}
