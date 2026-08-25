import type { PermissionKey } from '@/shared/constants/permissions';

export type UserDirectoryKind = 'staff' | 'rider' | 'vendor';

export type UserDirectoryStatus = 'not_invited' | 'pending' | 'onboard';

export interface CogginsStatus {
  applicable: boolean;

  compliant: boolean | null;
  reason: 'not_applicable' | 'missing' | 'expired' | 'unverified' | 'compliant';
  expirationDate: string | null;
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
}
