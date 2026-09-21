'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/shared/lib/supabase/server';
import { parseInput } from '@/shared/lib/action-result';
import { assertCanManageEntryLedger } from '@/modules/shows/data/entry-numbering';
import { markRingPacketPrintedSchema } from '@/modules/shows/schemas';
import { PRINT_CENTER_PATH } from '@/modules/shows/constants';

export async function markRingPacketPrinted(input: unknown): Promise<void> {
  const parsed = parseInput(markRingPacketPrintedSchema, input);
  await assertCanManageEntryLedger(parsed.showId);
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('classes')
    .update({ ring_packet_printed_at: new Date().toISOString() })
    .in('id', parsed.classIds);
  if (error) throw new Error(error.message);

  revalidatePath(PRINT_CENTER_PATH);
}
