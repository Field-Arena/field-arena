'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/shared/lib/supabase/server';
import { parseInput } from '@/shared/lib/action-result';
import {
  linkMembershipRecordSchema,
  updateMembershipCheckSchema,
  setMembershipVerificationStatusSchema,
} from '@/modules/shows/schemas';
import { assertCanManageEntryLedger } from '@/modules/shows/data/entry-numbering';
import { DOCUMENTS_PATH } from '@/modules/shows/constants';

async function ensureCheckRow(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  showId: string,
  showEntryId: string,
): Promise<string> {
  const { data: existing, error: readError } = await supabase
    .from('entry_membership_checks')
    .select('id')
    .eq('show_entry_id', showEntryId)
    .maybeSingle();
  if (readError) throw readError;
  if (existing) return existing.id;

  const { data: inserted, error: insertError } = await supabase
    .from('entry_membership_checks')
    .insert({ show_id: showId, show_entry_id: showEntryId })
    .select('id')
    .single();
  if (insertError) throw insertError;
  return inserted.id;
}

export async function linkMembershipRecord(input: unknown): Promise<void> {
  const parsed = parseInput(linkMembershipRecordSchema, input);
  await assertCanManageEntryLedger(parsed.showId);
  const supabase = await createServerClient();
  await ensureCheckRow(supabase, parsed.showId, parsed.showEntryId);

  let membershipStatus: 'active' | 'inactive' | 'unknown' = 'unknown';
  if (parsed.memberDatabaseId) {
    const { data: member, error: memberError } = await supabase
      .from('member_database')
      .select('membership_status')
      .eq('id', parsed.memberDatabaseId)
      .maybeSingle();
    if (memberError) throw memberError;
    membershipStatus = member?.membership_status === 'active' ? 'active' : 'inactive';
  }

  const { error } = await supabase
    .from('entry_membership_checks')
    .update({
      member_database_id: parsed.memberDatabaseId,
      membership_status: membershipStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('show_entry_id', parsed.showEntryId);
  if (error) throw error;

  revalidatePath(DOCUMENTS_PATH);
}

export async function updateMembershipCheck(input: unknown): Promise<void> {
  const parsed = parseInput(updateMembershipCheckSchema, input);
  await assertCanManageEntryLedger(parsed.showId);
  const supabase = await createServerClient();
  await ensureCheckRow(supabase, parsed.showId, parsed.showEntryId);

  const { error } = await supabase
    .from('entry_membership_checks')
    .update({
      association: parsed.association ?? null,
      rider_membership_number: parsed.riderMembershipNumber ?? null,
      horse_registration_number: parsed.horseRegistrationNumber ?? null,
      owner_membership_number: parsed.ownerMembershipNumber ?? null,
      membership_status: parsed.membershipStatus,
      horse_registration_status: parsed.horseRegistrationStatus,
      flags: parsed.flags,
      notes: parsed.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('show_entry_id', parsed.showEntryId);
  if (error) throw error;

  revalidatePath(DOCUMENTS_PATH);
}

export async function setMembershipVerificationStatus(input: unknown): Promise<void> {
  const parsed = parseInput(setMembershipVerificationStatusSchema, input);
  await assertCanManageEntryLedger(parsed.showId);
  const supabase = await createServerClient();
  await ensureCheckRow(supabase, parsed.showId, parsed.showEntryId);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('entry_membership_checks')
    .update({
      verification_status: parsed.verificationStatus,
      verified_at: parsed.verificationStatus === 'verified' ? new Date().toISOString() : null,
      verified_by: parsed.verificationStatus === 'verified' ? (user?.id ?? null) : null,
      updated_at: new Date().toISOString(),
    })
    .eq('show_entry_id', parsed.showEntryId);
  if (error) throw error;

  revalidatePath(DOCUMENTS_PATH);
}
