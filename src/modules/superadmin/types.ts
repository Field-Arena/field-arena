import type { Database } from '@/shared/types/database.types';
import type { PermissionKey } from '@/shared/constants/permissions';

/**
 * SuperAdmin console read shapes — the return types of `data/queries.ts`.
 *
 * Kept here rather than colocated in queries.ts so `ui/` components can import
 * them without importing from `data/` (layers.md: ui may never import data).
 */

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
  /**
   * entries x avg_entry_value, matching the legacy console's "Revenue (est.)"
   * column. It is an estimate and labelled as one: the legacy ARCHITECTURE note
   * is explicit that these figures were never Stripe data. Settled revenue comes
   * from paid orders and is reported separately on the billing page.
   */
  revenueEstimate: number;
  /**
   * Whether the Organizer owner has actually signed in for this organization.
   * Drives the Onboard/Pending pill: an organization can exist with shows
   * configured while its owner has never signed in, which is precisely the state
   * the "Resend invite" action exists for.
   */
  onboarded: boolean;
}

/**
 * One row from `leads`, as selected by listLeads/getLead (LEAD_COLUMNS in
 * data/queries.ts) — which is every column on the table, so this is the plain
 * generated Row type rather than a Pick.
 */
export type LeadRow = Database['public']['Tables']['leads']['Row'];

/**
 * One row from `scoring_catalog`, as selected by listScoringCatalog for the
 * catalog list — everything except `def` and `created_at`, which the list view
 * never reads (see getScoringSheet/ScoringSheet below for the full row).
 */
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

/**
 * One row from `scoring_catalog`, as selected by getScoringSheet for the
 * detail/editor view — every column, including `def`.
 */
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
  /**
   * `pending` means the account was provisioned but the person has never signed
   * in — they still owe the set-password step from their invite email. Legacy
   * drew the same line as "Active" vs "Invite pending".
   */
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
  /** For the "Add a user" show picker — only this org's shows. */
  shows: { id: string; name: string }[];
  staff: DirectoryStaff[];
}

/** One official test sheet's file-store identity, for the Documents board's Tests tab. */
export interface TestSheetItem {
  id: string;
  title: string;
  level: string | null;
  sourceFile: string;
}

// ── Billing ────────────────────────────────────────────────────────────────

export interface BillingSummary {
  /** Everything riders have actually paid, across every organization. */
  grossPaid: number;
  /** The platform's cut of that, fixed at order creation and never refundable. */
  platformFees: number;
  refunded: number;
  /** What organizers are owed: gross, less the platform's cut and refunds. */
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
  /**
   * Whether a Stripe Connect account is attached. A BOOLEAN, never the id.
   *
   * The RLS migration revokes column-level SELECT on stripe_connect_account_id
   * from authenticated and anon, so this cannot be read with the user's client at
   * all — it is fetched with the service key and reduced to a flag here, so the
   * payment identifier never leaves the server even in a props payload.
   */
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
  /** Boolean only — never the account id. See OrganizationBilling. */
  stripeConnected: boolean;
  volume: number;
  platformFee: number;
  net: number;
  shows: ShowBilling[];
}
