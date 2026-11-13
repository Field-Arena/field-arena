'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/shared/lib/supabase/server';
import { parseInput } from '@/shared/lib/action-result';
import { assertUpdated } from '@/modules/shows/data/assert-updated';
import { assertCanManageEntryLedger } from '@/modules/shows/data/entry-numbering';
import { markRingPacketPrintedSchema } from '@/modules/shows/schemas';
import { PRINT_CENTER_PATH } from '@/modules/shows/constants';

export async function markRingPacketPrinted(input: unknown): Promise<void> {
  const parsed = parseInput(markRingPacketPrintedSchema, input);
  await assertCanManageEntryLedger(parsed.showId);
  const supabase = await createServerClient();

  const { data: updatedRows, error } = await supabase
    .from('classes')
    .update({ ring_packet_printed_at: new Date().toISOString() })
    .eq('show_id', parsed.showId)
    .in('id', parsed.classIds)
    .select('id');
  if (error) throw new Error(error.message);
  assertUpdated(updatedRows, "You don't have permission to change these classes.");

  revalidatePath(PRINT_CENTER_PATH);
}
