import 'server-only';
import type { createAdminClient } from '@/shared/lib/supabase/admin';
import type { Json } from '@/shared/types/database.types';
import { MAX_CHARGE_RECORD_ATTEMPTS } from '@/modules/sales/constants';
import { rawCharges, type RawAdditionalCharge } from '@/modules/sales/utils/additional-charges';

type AdminClient = ReturnType<typeof createAdminClient>;
export type SaleLedgerTable = 'orders' | 'vendor_bookings';

export interface AdditionalChargesSnapshot {
  // Deep copies — safe for the builder to mutate.
  charges: RawAdditionalCharge[];
  total: number;
}

/* What a ledger builder decides after looking at the current row: write a new
 * array (and optionally a new additional_charges_total), or stop without
 * writing. Either way `result` is handed back to the caller. */
export type LedgerStep<T> =
  | { write: true; charges: RawAdditionalCharge[]; total?: number; result: T }
  | { write: false; result: T };

/* Read-modify-write of `additional_charges` with a compare-and-swap on the
 * EXACT previous jsonb value (and on additional_charges_total), retried on a
 * lost race. Every writer of the array — chargeMore appending a charge, a
 * charge refund reserving / finalising / rolling back, the webhook syncing an
 * outside refund — goes through here, so none of them can overwrite another's
 * element with a stale copy.
 *
 * jsonb equality is semantic (key order and number formatting don't matter),
 * so comparing against the JSON we read back is exact. The value goes in as a
 * JSON string because supabase-js interpolates filter values into the URL. */
export async function updateAdditionalChargesLedger<T>(
  admin: AdminClient,
  table: SaleLedgerTable,
  saleId: string,
  build: (current: AdditionalChargesSnapshot) => LedgerStep<T>,
): Promise<T> {
  for (let attempt = 0; attempt < MAX_CHARGE_RECORD_ATTEMPTS; attempt++) {
    const { data: row, error: readError } = await admin
      .from(table)
      .select('additional_charges_total, additional_charges')
      .eq('id', saleId)
      .single();
    if (readError) throw new Error(readError.message);

    const previousRaw = row.additional_charges;
    const previousTotal = row.additional_charges_total;
    const step = build({
      charges: structuredClone(rawCharges(previousRaw)),
      total: previousTotal ?? 0,
    });
    if (!step.write) return step.result;

    let query = admin
      .from(table)
      .update({
        additional_charges: step.charges as Json,
        ...(step.total === undefined ? {} : { additional_charges_total: step.total }),
      })
      .eq('id', saleId);
    query =
      previousRaw === null
        ? query.is('additional_charges', null)
        : query.eq('additional_charges', JSON.stringify(previousRaw));
    query =
      previousTotal === null
        ? query.is('additional_charges_total', null)
        : query.eq('additional_charges_total', previousTotal);

    const { data: updated, error: updateError } = await query.select('id').maybeSingle();
    if (updateError) throw new Error(updateError.message);
    if (updated) return step.result;
  }
  throw new Error('This sale kept changing while it was being updated — reload and try again.');
}
