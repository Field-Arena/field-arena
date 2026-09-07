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

  /** False when the name above was derived from the title, not stored on the sheet. */
  hasDeclaredSourceFile: boolean;
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
  stripeStatus: StripeConnectStatus;
  pendingPayout: number;
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
  stripeStatus: StripeConnectStatus;
  stripeAccountId: string | null;
  payoutsEnabled: boolean;
  payouts: StripePayout[];
  stripeError: string | null;
  volume: number;
  platformFee: number;
  net: number;
  shows: ShowBilling[];
}

/* The five states legacy's stripeStatusPill() distinguished. Collapsing these
 * to a boolean hides exactly the accounts that need chasing: `restricted` and
 * `onboarding` both have an account id on file but cannot take money. */
export type StripeConnectStatus =
  'not_connected' | 'onboarding' | 'restricted' | 'active' | 'error';

export interface StripePayout {
  id: string;
  amount: number;
  currency: string;
  status: string;
  arrivalDate: number | null;
}

export interface StripeAccountStatus {
  accountId: string | null;
  status: StripeConnectStatus;
  payoutsEnabled: boolean;
  payouts: StripePayout[];
  error?: string;
}

export type ShowStage = 'setup' | 'on-sale' | 'live';

export interface OrganizationShow {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  stage: ShowStage;
  published: boolean;
  entryCount: number;
}

export interface OrganizationShowsDetail {
  id: string;
  name: string;
  city: string | null;
  region: string | null;
  currency: string | null;
  locale: string | null;
  onboarded: boolean;
  shows: OrganizationShow[];
}

export interface ShowRosterEntry {
  className: string;
  division: string;
  fee: number;
  percent: number | null;
}

export interface ShowRosterRider {
  key: string;
  num: string;
  name: string;
  horse: string;
  entries: ShowRosterEntry[];
  feeTotal: number;
}

export interface IndependentTestTemplate {
  id: string;
  name: string;
  level: string | null;
  sourceLabel: string | null;
  orgId: string;
  orgName: string;
  createdAt: string;
}
