'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/shared/lib/supabase/server';
import { env } from '@/shared/lib/env';
import { parseInput, UserFacingError } from '@/shared/lib/action-result';
import type { Json } from '@/shared/types/database.types';
import {
  addManualHorseSchema,
  verifyHorseDocumentSchema,
  remindHorseDocumentsSchema,
  reviewHorseDocumentSchema,
} from '@/modules/shows/schemas';
import { HORSES_PATH, DOCUMENTS_PATH } from '@/modules/shows/constants';
import type { DocumentRequirement, ManualHorseEntry } from '@/modules/shows/types';

type SupabaseClient = Awaited<ReturnType<typeof createServerClient>>;

// Patches one requirement's upload inside horses.document_uploads in a single
// UPDATE (patch_horse_document_upload) instead of read-modify-write, so a
// rider uploading another document at the same moment isn't overwritten.
// Keys whose value is undefined are removed, matching what JSON.stringify
// did to them in the old whole-array write.
async function patchHorseDocumentUpload(
  supabase: SupabaseClient,
  horseId: string,
  requirementId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const set: Record<string, unknown> = {};
  const unset: string[] = [];
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) unset.push(key);
    else set[key] = value;
  }
  const { data, error } = await supabase.rpc('patch_horse_document_upload', {
    p_horse_id: horseId,
    p_requirement_id: requirementId,
    p_set: set as Json,
    p_unset: unset,
  });
  if (error) throw new Error(error.message);
  if (!data) {
    throw new UserFacingError("You don't have permission to review this horse's documents.");
  }
}

export async function addManualHorse(input: unknown): Promise<{ id: string }> {
  const parsed = parseInput(addManualHorseSchema, input);
  const supabase = await createServerClient();

  const entry: ManualHorseEntry = {
    id: crypto.randomUUID(),
    riderName: parsed.riderName,
    horseName: parsed.horseName,
    isStallion: parsed.isStallion,
    addedAt: new Date().toISOString(),
  };

  // Appended in SQL so two horses added at once both survive.
  const { data, error } = await supabase.rpc('append_show_manual_horse', {
    p_show_id: parsed.showId,
    p_entry: entry as unknown as Json,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new UserFacingError("You don't have permission to add horses here.");

  revalidatePath(HORSES_PATH);
  return { id: entry.id };
}

export async function verifyHorseDocument(input: unknown): Promise<void> {
  const parsed = parseInput(verifyHorseDocumentSchema, input);
  const supabase = await createServerClient();

  /* Legacy allowed an organizer to correct a rider-entered expiry typo through
   * this same route, patching only the fields present in the body
   * (verify-horse-document, api/rider/[resource].js). Including the parsed
   * fields conditionally keeps that: a verified-only call leaves the stored
   * date alone, and a date-only correction leaves verification alone.
   * `status` is kept in sync with `verified` so the newer review workflow
   * (reviewHorseDocument) reads a consistent status for rows only ever
   * touched through this older checkbox route. */
  await patchHorseDocumentUpload(supabase, parsed.horseId, parsed.requirementId, {
    ...(parsed.verified !== undefined
      ? { verified: parsed.verified, status: parsed.verified ? 'approved' : 'pending' }
      : {}),
    ...(parsed.expirationDate !== undefined ? { expirationDate: parsed.expirationDate } : {}),
  });

  revalidatePath(HORSES_PATH);
  revalidatePath(DOCUMENTS_PATH);
}

export async function reviewHorseDocument(input: unknown): Promise<void> {
  const parsed = parseInput(reviewHorseDocumentSchema, input);
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const now = new Date().toISOString();

  await patchHorseDocumentUpload(supabase, parsed.horseId, parsed.requirementId, {
    status: parsed.status,
    verified: parsed.status === 'approved',
    rejectionReason: parsed.status === 'rejected' ? parsed.rejectionReason : undefined,
    rejectionNote: parsed.status === 'rejected' ? parsed.rejectionNote : undefined,
    replacementRequestedAt: parsed.status === 'replacement_requested' ? now : undefined,
    reviewedAt: now,
    reviewedBy: user?.id,
  });

  revalidatePath(HORSES_PATH);
  revalidatePath(DOCUMENTS_PATH);
}

async function sendReminderEmail(params: {
  to: string;
  riderName: string;
  horseName: string;
  showName: string;
  missingLabels: string[];
}): Promise<void> {
  const list = params.missingLabels.map((label) => `<li>${label}</li>`).join('');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Field & Arena <notifications@field-arena.com>',
      to: params.to,
      subject: `Missing documents for ${params.horseName} — ${params.showName}`,
      html:
        `<p>Hi ${params.riderName},</p>` +
        `<p>${params.horseName} still needs the following before ${params.showName}:</p>` +
        `<ul>${list}</ul>` +
        `<p>Log in to your Field &amp; Arena account any time before the show to upload them.</p>`,
    }),
  });

  if (!res.ok) {
    throw new Error("Couldn't send the reminder email. Please try again.");
  }
}

export async function remindHorseDocuments(input: unknown): Promise<{ ok: true }> {
  const parsed = parseInput(remindHorseDocumentsSchema, input);
  const supabase = await createServerClient();

  const [showResult, horseResult] = await Promise.all([
    supabase.from('shows').select('name, document_requirements').eq('id', parsed.showId).single(),
    supabase
      .from('horses')
      .select('name, document_uploads, rider_id')
      .eq('id', parsed.horseId)
      .single(),
  ]);
  if (showResult.error) throw new Error(showResult.error.message);
  if (horseResult.error) throw new Error(horseResult.error.message);

  const horse = horseResult.data;
  if (!horse.rider_id) throw new Error('No rider account on file for this horse.');

  const { data: rider, error: riderError } = await supabase
    .from('riders')
    .select('email, first_name, last_name')
    .eq('id', horse.rider_id)
    .single();
  if (riderError) throw new Error(riderError.message);
  if (!rider.email) throw new Error('No email on file for this rider.');

  const requirements = (showResult.data.document_requirements ??
    []) as unknown as DocumentRequirement[];
  const uploads = (horse.document_uploads ?? []) as { requirementId?: string }[];
  const missing = requirements.filter(
    (r) => r.label.trim() && !uploads.some((u) => u.requirementId === r.id),
  );
  if (missing.length === 0) throw new Error('Nothing missing to remind about.');

  const riderName = [rider.first_name, rider.last_name].filter(Boolean).join(' ') || 'there';

  await sendReminderEmail({
    to: rider.email,
    riderName,
    horseName: horse.name,
    showName: showResult.data.name,
    missingLabels: missing.map((m) => m.label),
  });

  return { ok: true };
}
