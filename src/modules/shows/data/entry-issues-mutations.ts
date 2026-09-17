'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/shared/lib/supabase/server';
import { parseInput } from '@/shared/lib/action-result';
import {
  addManualIssueSchema,
  resolveIssueSchema,
  markEntryClearedSchema,
  updateShowEntryStatusSchema,
} from '@/modules/shows/schemas';
import { assertCanManageEntryLedger } from '@/modules/shows/data/entry-numbering';
import { DOCUMENTS_PATH } from '@/modules/shows/constants';

export async function addManualIssue(input: unknown): Promise<void> {
  const parsed = parseInput(addManualIssueSchema, input);
  await assertCanManageEntryLedger(parsed.showId);
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from('entry_issues').insert({
    show_id: parsed.showId,
    show_entry_id: parsed.showEntryId,
    kind: parsed.kind,
    message: parsed.message,
    detail: parsed.detail ?? null,
    status: 'open',
    source: 'manual',
    created_by: user?.id ?? null,
  });
  if (error) throw error;

  revalidatePath(DOCUMENTS_PATH);
}

/* Resolving never deletes — the row stays with status: 'resolved' so the
 * review log is preserved, it just drops off the active-issues view. */
export async function resolveIssue(input: unknown): Promise<void> {
  const parsed = parseInput(resolveIssueSchema, input);

  const supabase = await createServerClient();
  const { data: issue, error: readError } = await supabase
    .from('entry_issues')
    .select('show_id')
    .eq('id', parsed.issueId)
    .single();
  if (readError) throw readError;
  await assertCanManageEntryLedger(issue.show_id);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('entry_issues')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolved_by: user?.id ?? null,
      resolution_note: parsed.resolutionNote ?? null,
    })
    .eq('id', parsed.issueId);
  if (error) throw error;

  revalidatePath(DOCUMENTS_PATH);
}

export async function markEntryCleared(input: unknown): Promise<void> {
  const parsed = parseInput(markEntryClearedSchema, input);
  await assertCanManageEntryLedger(parsed.showId);
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('show_entries')
    .update({
      status: 'cleared',
      cleared_at: new Date().toISOString(),
      cleared_by: user?.id ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.showEntryId)
    .eq('show_id', parsed.showId);
  if (error) throw error;

  revalidatePath(DOCUMENTS_PATH);
}

export async function updateShowEntryStatus(input: unknown): Promise<void> {
  const parsed = parseInput(updateShowEntryStatusSchema, input);
  await assertCanManageEntryLedger(parsed.showId);
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('show_entries')
    .update({ status: parsed.status, updated_at: new Date().toISOString() })
    .eq('id', parsed.showEntryId)
    .eq('show_id', parsed.showId);
  if (error) throw error;

  revalidatePath(DOCUMENTS_PATH);
}
