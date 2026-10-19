'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/shared/lib/supabase/server';
import { parseInput } from '@/shared/lib/action-result';
import { updateEntryNumberSchema, updateBackNumberSchema } from '@/modules/shows/schemas';
import { assertUpdated } from '@/modules/shows/data/assert-updated';
import { assertCanManageEntryLedger } from '@/modules/shows/data/entry-numbering';
import { DOCUMENTS_PATH } from '@/modules/shows/constants';

export async function updateEntryNumber(input: unknown): Promise<void> {
  const parsed = parseInput(updateEntryNumberSchema, input);
  await assertCanManageEntryLedger(parsed.showId);
  const supabase = await createServerClient();

  const { data: updatedRows, error } = await supabase
    .from('show_entries')
    .update({ entry_number: parsed.entryNumber })
    .eq('id', parsed.showEntryId)
    .eq('show_id', parsed.showId)
    .select('id');
  if (error) throw error;
  assertUpdated(updatedRows, "You don't have permission to change this entry.");

  revalidatePath(DOCUMENTS_PATH);
}

export async function updateBackNumber(input: unknown): Promise<void> {
  const parsed = parseInput(updateBackNumberSchema, input);
  await assertCanManageEntryLedger(parsed.showId);
  const supabase = await createServerClient();

  const { data: updatedRows, error } = await supabase
    .from('show_entries')
    .update({ back_number: parsed.backNumber })
    .eq('id', parsed.showEntryId)
    .eq('show_id', parsed.showId)
    .select('id');
  if (error) throw error;
  assertUpdated(updatedRows, "You don't have permission to change this entry.");

  revalidatePath(DOCUMENTS_PATH);
}
