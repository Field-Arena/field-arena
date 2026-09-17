'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/shared/lib/supabase/server';
import { parseInput } from '@/shared/lib/action-result';
import {
  updateEntryNumberSchema,
  updateBridleNumberSchema,
  updateBackNumberSchema,
} from '@/modules/shows/schemas';
import { assertCanManageEntryLedger } from '@/modules/shows/data/entry-numbering';
import { DOCUMENTS_PATH } from '@/modules/shows/constants';

export async function updateEntryNumber(input: unknown): Promise<void> {
  const parsed = parseInput(updateEntryNumberSchema, input);
  await assertCanManageEntryLedger(parsed.showId);
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('show_entries')
    .update({ entry_number: parsed.entryNumber })
    .eq('id', parsed.showEntryId)
    .eq('show_id', parsed.showId);
  if (error) throw error;

  revalidatePath(DOCUMENTS_PATH);
}

export async function updateBridleNumber(input: unknown): Promise<void> {
  const parsed = parseInput(updateBridleNumberSchema, input);
  await assertCanManageEntryLedger(parsed.showId);
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('show_horses')
    .update({ bridle_number: parsed.bridleNumber })
    .eq('id', parsed.showHorseId)
    .eq('show_id', parsed.showId);
  if (error) throw error;

  revalidatePath(DOCUMENTS_PATH);
}

export async function updateBackNumber(input: unknown): Promise<void> {
  const parsed = parseInput(updateBackNumberSchema, input);
  await assertCanManageEntryLedger(parsed.showId);
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('show_entries')
    .update({ back_number: parsed.backNumber })
    .eq('id', parsed.showEntryId)
    .eq('show_id', parsed.showId);
  if (error) throw error;

  revalidatePath(DOCUMENTS_PATH);
}
