import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';

/**
 * Show-scoped setup reads for the organizer workspace: classes, divisions,
 * staff, documents, the sales catalogs and the billing tab.
 *
 * Kept separate from queries.ts, which covers the dashboard's show list and
 * headline counts. Both are the shows module's data layer; splitting them keeps
 * either file readable.
 */

export interface ClassRow {
  id: string;
  label: string;
  displayName: string | null;
  division: string | null;
  fee: number;
  judgesCount: number;
  date: string | null;
  time: string | null;
  entryCount: number;
  scoringOpen: boolean;
  resultsPublished: boolean;
  ribbonPlaces: number;
  awardScope: string;
}

export async function listClasses(showId: string): Promise<ClassRow[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('classes')
    .select(
      'id, label, display_name, division, fee, judges_count, date, time, scoring_open, results_published, ribbon_places, award_scope'
    )
    .eq('show_id', showId)
    .order('label');
  if (error) throw error;

  if (data.length === 0) return [];

  // Entry counts in one query rather than one per class — the N+1 shape the
  // legacy codebase kept a dedicated regression test for.
  const { data: entries, error: entryError } = await supabase
    .from('class_entries')
    .select('class_id')
    .in(
      'class_id',
      data.map((c) => c.id)
    );
  if (entryError) throw entryError;

  const counts = new Map<string, number>();
  for (const entry of entries) {
    counts.set(entry.class_id, (counts.get(entry.class_id) ?? 0) + 1);
  }

  return data.map((c) => ({
    id: c.id,
    label: c.label,
    displayName: c.display_name,
    division: c.division,
    fee: c.fee ?? 0,
    judgesCount: c.judges_count ?? 1,
    date: c.date,
    time: c.time,
    entryCount: counts.get(c.id) ?? 0,
    scoringOpen: c.scoring_open ?? false,
    resultsPublished: c.results_published ?? false,
    ribbonPlaces: c.ribbon_places ?? 6,
    awardScope: c.award_scope,
  }));
}

export interface DivisionRow {
  id: string;
  name: string;
  position: number;
  classCount: number;
}

export async function listDivisions(showId: string): Promise<DivisionRow[]> {
  const supabase = await createServerClient();

  const [divisions, classes] = await Promise.all([
    supabase.from('divisions').select('id, name, position').eq('show_id', showId).order('position'),
    supabase.from('classes').select('division').eq('show_id', showId),
  ]);
  if (divisions.error) throw divisions.error;
  if (classes.error) throw classes.error;

  const counts = new Map<string, number>();
  for (const row of classes.data) {
    if (row.division) counts.set(row.division, (counts.get(row.division) ?? 0) + 1);
  }

  return divisions.data.map((d) => ({
    id: d.id,
    name: d.name,
    position: d.position ?? 0,
    classCount: counts.get(d.name) ?? 0,
  }));
}

export interface StaffRow {
  id: string;
  name: string;
  role: string;
  email: string | null;
  phone: string | null;
  status: string;
  isSteward: boolean;
  accepted: boolean;
  canViewMoney: boolean;
  canScratchSkipDq: boolean;
}

export async function listStaff(showId: string): Promise<StaffRow[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('staff_assignments')
    .select('id, name, role, email, phone, status, is_steward, user_id, can_view_money, can_scratch_skip_dq')
    .eq('show_id', showId)
    .order('role')
    .order('name');
  if (error) throw error;

  return data.map((s) => ({
    id: s.id,
    name: s.name,
    role: s.role,
    email: s.email,
    phone: s.phone,
    status: s.status ?? 'pending',
    isSteward: s.is_steward ?? false,
    // user_id is set only when the invite is accepted, which is the real signal;
    // `status` tracks the same thing for display but can be edited by hand.
    accepted: s.user_id !== null,
    canViewMoney: s.can_view_money ?? false,
    canScratchSkipDq: s.can_scratch_skip_dq ?? false,
  }));
}

export interface CatalogItem {
  id: string;
  name: string;
  price: number;
  enabled: boolean;
  qty: number | null;
}

export interface SalesCatalog {
  addOns: CatalogItem[];
  qualTypes: CatalogItem[];
  vendorItems: CatalogItem[];
  merchItems: { id: string; name: string; price: number }[];
  merchEnabled: boolean;
  merchSalesTotal: number;
}

export async function getSalesCatalog(showId: string): Promise<SalesCatalog> {
  const supabase = await createServerClient();

  const [addOns, qualTypes, vendorItems, show, merchSales] = await Promise.all([
    supabase.from('add_ons').select('id, name, price, enabled, qty').eq('show_id', showId).order('name'),
    supabase.from('qual_types').select('id, name, price, enabled').eq('show_id', showId).order('name'),
    supabase.from('vendor_items').select('id, name, price, enabled, qty').eq('show_id', showId).order('name'),
    supabase.from('shows').select('merchandise_enabled, merch_items').eq('id', showId).single(),
    supabase.from('merch_sales').select('total').eq('show_id', showId),
  ]);

  if (addOns.error) throw addOns.error;
  if (qualTypes.error) throw qualTypes.error;
  if (vendorItems.error) throw vendorItems.error;
  if (show.error) throw show.error;
  if (merchSales.error) throw merchSales.error;

  return {
    addOns: addOns.data.map((a) => ({
      id: a.id,
      name: a.name,
      price: a.price ?? 0,
      enabled: a.enabled ?? true,
      qty: a.qty,
    })),
    qualTypes: qualTypes.data.map((q) => ({
      id: q.id,
      name: q.name,
      price: q.price ?? 0,
      enabled: q.enabled ?? false,
      qty: null,
    })),
    vendorItems: vendorItems.data.map((v) => ({
      id: v.id,
      name: v.name,
      price: v.price ?? 0,
      enabled: v.enabled ?? true,
      qty: v.qty,
    })),
    merchItems: (show.data.merch_items ?? []) as { id: string; name: string; price: number }[],
    merchEnabled: show.data.merchandise_enabled ?? false,
    merchSalesTotal: merchSales.data.reduce((sum, m) => sum + m.total, 0),
  };
}

export interface ShowDocumentRow {
  id: string;
  name: string;
  url: string | null;
  createdAt: string;
}

export async function listShowDocuments(showId: string): Promise<ShowDocumentRow[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('documents')
    .select('id, name, url, created_at')
    .eq('show_id', showId)
    .order('name');
  if (error) throw error;

  return data.map((d) => ({ id: d.id, name: d.name, url: d.url, createdAt: d.created_at }));
}

export interface DocumentRequirement {
  id: string;
  label: string;
  requiresExpiration?: boolean;
  requiresApproval?: boolean;
}

export async function getDocumentRequirements(showId: string): Promise<DocumentRequirement[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('shows')
    .select('document_requirements')
    .eq('id', showId)
    .single();
  if (error) throw error;
  // jsonb comes back as the generated Json union, which does not overlap with a
  // specific object shape — the double assertion is the documented way to narrow
  // it. The column's contents are written only by this app.
  return (data.document_requirements ?? []) as unknown as DocumentRequirement[];
}

export interface ShowBilling {
  settledRevenue: number;
  paidOrders: number;
  entryValue: number;
  vendorRevenue: number;
  merchRevenue: number;
  expenses: { id: string; label: string; amount: number }[];
  expenseTotal: number;
}

/**
 * The billing tab's simple profit-and-loss.
 *
 * Expenses are a jsonb checklist on the show rather than a ledger — the legacy
 * schema was explicit that this is a cost checklist, not accounting. Revenue is
 * reported in two parts: what has actually been collected, and what the roster is
 * worth at current prices. Merging them would present money nobody has paid as
 * income.
 */
export async function getShowBilling(showId: string): Promise<ShowBilling> {
  const supabase = await createServerClient();

  const [orders, show, merch, vendors, classes] = await Promise.all([
    supabase.from('orders').select('amount_total').eq('show_id', showId).eq('status', 'paid'),
    supabase.from('shows').select('expenses').eq('id', showId).single(),
    supabase.from('merch_sales').select('total').eq('show_id', showId),
    supabase.from('vendor_bookings').select('amount_total').eq('show_id', showId).eq('status', 'paid'),
    supabase.from('classes').select('id, fee').eq('show_id', showId),
  ]);

  if (orders.error) throw orders.error;
  if (show.error) throw show.error;
  if (merch.error) throw merch.error;
  if (vendors.error) throw vendors.error;
  if (classes.error) throw classes.error;

  let entryValue = 0;
  if (classes.data.length > 0) {
    const feeByClass = new Map(classes.data.map((c) => [c.id, c.fee ?? 0]));
    const { data: entries, error: entryError } = await supabase
      .from('class_entries')
      .select('class_id')
      .in(
        'class_id',
        classes.data.map((c) => c.id)
      );
    if (entryError) throw entryError;
    entryValue = entries.reduce((sum, e) => sum + (feeByClass.get(e.class_id) ?? 0), 0);
  }

  const expenses = (show.data.expenses ?? []) as { id: string; label: string; amount: number }[];

  return {
    settledRevenue: orders.data.reduce((sum, o) => sum + o.amount_total, 0),
    paidOrders: orders.data.length,
    entryValue,
    vendorRevenue: vendors.data.reduce((sum, v) => sum + (v.amount_total ?? 0), 0),
    merchRevenue: merch.data.reduce((sum, m) => sum + m.total, 0),
    expenses,
    expenseTotal: expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
  };
}
