import type { Database } from '@/shared/types/database.types';
import type { PermissionKey } from '@/shared/constants/permissions';

export interface PlatformStats {
  organizations: number;
  activeOrganizations: number;
  shows: number;
  publishedShows: number;
  classes: number;
  entries: number;
  riders: number;
  staff: number;
  revenue: number;
  paidOrders: number;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  city: string | null;
  region: string | null;
  currency: string | null;
  locale: string | null;
  suspended: boolean;
  isDemo: boolean;
  deletedAt: string | null;
  feeModel: string;
  showCount: number;
  entryCount: number;
  riderCount: number;

  revenueEstimate: number;

  onboarded: boolean;
}

export type LeadRow = Database['public']['Tables']['leads']['Row'];

export type CatalogSheetRow = Pick<
  Database['public']['Tables']['scoring_catalog']['Row'],
  | 'id'
  | 'title'
  | 'level'
  | 'discipline'
  | 'family'
  | 'governing_body'
  | 'source'
  | 'source_file'
  | 'updated_at'
>;

export type ScoringSheet = Database['public']['Tables']['scoring_catalog']['Row'];

export interface CatalogDocument {
  id: string;
  folder: string;
  name: string;
  url: string | null;
  createdAt: string;
}

export interface PlatformAccount {
  id: string;
  name: string;
  email: string;
  role: string | null;
  createdAt: string;

  status: 'active' | 'pending';
}

export interface DirectoryStaff {
  id: string;
  name: string;
  email: string | null;
  role: string;
  showId: string;
  showName: string;
  status: string | null;
  permissions: Record<PermissionKey, boolean>;
  permissionCount: number;
}

export interface DirectoryOrganizer {
  id: string;
  name: string;
  city: string | null;
  region: string | null;
  showCount: number;

  shows: { id: string; name: string }[];
  staff: DirectoryStaff[];
}

export interface TestSheetItem {
  id: string;
  title: string;
  level: string | null;
  sourceFile: string;
}

export interface BillingSummary {
  grossPaid: number;

  platformFees: number;
  refunded: number;

  netToOrganizers: number;
  paidOrders: number;
  pendingOrders: number;
  failedOrders: number;
}

export interface OrganizationBilling {
  id: string;
  name: string;
  city: string | null;
  region: string | null;
  feeModel: string;
  currency: string | null;
  locale: string | null;
  paidOrders: number;
  gross: number;
  platformFee: number;
  refunded: number;
  net: number;

  stripeConnected: boolean;
}

export interface ShowBilling {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  volume: number;
  platformFee: number;
  net: number;
}

export interface OrganizationBillingDetail {
  id: string;
  name: string;
  city: string | null;
  region: string | null;
  currency: string | null;
  locale: string | null;
  feeModel: string;
  payoutCadence: string;
  holdbackPercent: number | null;

  stripeConnected: boolean;
  volume: number;
  platformFee: number;
  net: number;
  shows: ShowBilling[];
}
