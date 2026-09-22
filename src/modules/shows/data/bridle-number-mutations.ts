'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/shared/lib/supabase/server';
import { parseInput, UserFacingError } from '@/shared/lib/action-result';
import {
  createNumberRangeSchema,
  deleteNumberRangeSchema,
  markNumberUnavailableSchema,
  restoreNumberAvailabilitySchema,
  assignBridleNumberSchema,
} from '@/modules/shows/schemas';
import { assertCanManageEntryLedger } from '@/modules/shows/data/entry-numbering';
import { DOCUMENTS_PATH } from '@/modules/shows/constants';

const NUMBER_NOT_AVAILABLE = 'FA011';
const NO_NUMBERS_LEFT = 'FA012';

/* insert ... on conflict do nothing, built from a plain JS array rather than
 * a generate_series RPC — a pack of even a few hundred numbers is a trivial
 * single upsert, and overlapping ranges dedupe for free: whichever range's
 * row lands first keeps source_range_id, the second range's conflicting
 * numbers are silently skipped. */
export async function createNumberRange(input: unknown): Promise<void> {
  const parsed = parseInput(createNumberRangeSchema, input);
  await assertCanManageEntryLedger(parsed.showId);
  const supabase = await createServerClient();

  const { data: range, error: rangeError } = await supabase
    .from('show_number_ranges')
    .insert({
      show_id: parsed.showId,
      range_start: parsed.rangeStart,
      range_end: parsed.rangeEnd,
      label: parsed.label ?? null,
    })
    .select('id')
    .single();
  if (rangeError) throw rangeError;

  const numbers = Array.from(
    { length: parsed.rangeEnd - parsed.rangeStart + 1 },
    (_, i) => parsed.rangeStart + i,
  ).map((number) => ({
    show_id: parsed.showId,
    number,
    source_range_id: range.id,
  }));

  const { error: seedError } = await supabase
    .from('show_bridle_numbers')
    .upsert(numbers, { onConflict: 'show_id,number', ignoreDuplicates: true });
  if (seedError) throw seedError;

  revalidatePath(DOCUMENTS_PATH);
}

export async function deleteNumberRange(input: unknown): Promise<void> {
  const parsed = parseInput(deleteNumberRangeSchema, input);
  await assertCanManageEntryLedger(parsed.showId);
  const supabase = await createServerClient();

  const { count, error: countError } = await supabase
    .from('show_bridle_numbers')
    .select('id', { count: 'exact', head: true })
    .eq('show_id', parsed.showId)
    .eq('source_range_id', parsed.rangeId)
    .eq('status', 'assigned');
  if (countError) throw countError;
  if ((count ?? 0) > 0) {
    throw new UserFacingError(
      "Some numbers from this range are still assigned — replace those horses' numbers before deleting it.",
    );
  }

  const { error } = await supabase
    .from('show_number_ranges')
    .delete()
    .eq('id', parsed.rangeId)
    .eq('show_id', parsed.showId);
  if (error) throw error;

  revalidatePath(DOCUMENTS_PATH);
}

export async function markNumberUnavailable(input: unknown): Promise<void> {
  const parsed = parseInput(markNumberUnavailableSchema, input);
  await assertCanManageEntryLedger(parsed.showId);
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('show_bridle_numbers')
    .update({ status: 'unavailable', unavailable_reason: parsed.reason ?? null })
    .eq('show_id', parsed.showId)
    .eq('number', parsed.number)
    .eq('status', 'available')
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new UserFacingError(
      "That number can't be marked unavailable right now — it may already be assigned or retired.",
    );
  }

  revalidatePath(DOCUMENTS_PATH);
}

export async function restoreNumberAvailability(input: unknown): Promise<void> {
  const parsed = parseInput(restoreNumberAvailabilitySchema, input);
  await assertCanManageEntryLedger(parsed.showId);
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('show_bridle_numbers')
    .update({ status: 'available', unavailable_reason: null })
    .eq('show_id', parsed.showId)
    .eq('number', parsed.number)
    .eq('status', 'unavailable')
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new UserFacingError("That number isn't currently marked unavailable.");
  }

  revalidatePath(DOCUMENTS_PATH);
}

/* The single write path for a bridle number — first assignment, manual
 * pick, "next available" auto-assign, and replace/correction all go
 * through the same security-definer RPC (assign_bridle_number,
 * supabase/migrations/20260922123000_*), which validates the number
 * against the pool and retires the old one atomically under a per-show
 * advisory lock. See that migration for why a bare unique-index catch
 * isn't enough here. */
export async function assignBridleNumber(input: unknown): Promise<{ bridleNumber: string }> {
  const parsed = parseInput(assignBridleNumberSchema, input);
  await assertCanManageEntryLedger(parsed.showId);
  const supabase = await createServerClient();

  const { data, error } = await supabase.rpc('assign_bridle_number', {
    p_show_id: parsed.showId,
    p_show_horse_id: parsed.showHorseId,
    p_explicit_number: parsed.explicitNumber,
    p_reason: parsed.reason,
  });
  if (error) {
    if (error.code === NUMBER_NOT_AVAILABLE || error.code === NO_NUMBERS_LEFT) {
      throw new UserFacingError(error.message);
    }
    throw error;
  }

  revalidatePath(DOCUMENTS_PATH);
  return { bridleNumber: data };
}
