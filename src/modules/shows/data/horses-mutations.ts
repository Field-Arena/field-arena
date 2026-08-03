'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/shared/lib/supabase/server';
import { env } from '@/shared/lib/env';
import type { Json } from '@/shared/types/database.types';
import {
  addManualHorseSchema,
  verifyHorseDocumentSchema,
  remindHorseDocumentsSchema,
} from '../schemas';
import type { ManualHorseEntry } from './horses-queries';
import type { DocumentRequirement } from './setup-queries';

const HORSES_PATH = '/dashboard/horses';

/**
 * Horses screen writes: the "+ Add Horse" manual entry, the per-document
 * verify checkbox, and the missing-documents reminder email.
 *
 * The first two go through the caller's own client — RLS is the security
 * boundary (architecture.md) — same as every other show mutation in this
 * module. The reminder's actual send has no RLS concept at all: it is a
 * direct call to Resend's REST API.
 */

/**
 * "+ Add Horse" — a horse with no real class entry behind it: the
 * organizer's own, or any staff member's if they're also riding. Writes to
 * shows.manual_horses (`[{id, riderName, horseName, isStallion, addedAt}]`
 * per that column's own comment), not a real horses/riders row — see
 * horses-queries.ts's module doc comment for why. Ported from
 * showstaff.html's submitManualHorse (~13608-13619).
 */
export async function addManualHorse(input: unknown): Promise<{ id: string }> {
  const parsed = addManualHorseSchema.parse(input);
  const supabase = await createServerClient();

  const { data: show, error: readError } = await supabase
    .from('shows')
    .select('manual_horses')
    .eq('id', parsed.showId)
    .single();
  if (readError) throw new Error(readError.message);

  const current = (show.manual_horses ?? []) as unknown as ManualHorseEntry[];
  const entry: ManualHorseEntry = {
    id: crypto.randomUUID(),
    riderName: parsed.riderName,
    horseName: parsed.horseName,
    isStallion: parsed.isStallion,
    addedAt: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('shows')
    // Named-interface arrays don't structurally satisfy Json's index
    // signature the way an inline object literal type does (the same reason
    // every other jsonb write in this module's sibling mutations.ts builds
    // its update payload as an object literal rather than a typed variable) —
    // asserted through unknown rather than reshaping ManualHorseEntry.
    .update({ manual_horses: [...current, entry] as unknown as Json })
    .eq('id', parsed.showId);
  if (error) throw new Error(error.message);

  revalidatePath(HORSES_PATH);
  return { id: entry.id };
}

/**
 * The per-document verify checkbox — read-modify-write on the one matching
 * entry in horses.document_uploads. Un-verifying is just as real a call as
 * verifying, matching showstaff.html's realVerifyHorseDocFromHorsesList
 * (~13555-13564), which always sends the checkbox's actual state.
 */
export async function verifyHorseDocument(input: unknown): Promise<void> {
  const parsed = verifyHorseDocumentSchema.parse(input);
  const supabase = await createServerClient();

  const { data: horse, error: readError } = await supabase
    .from('horses')
    .select('document_uploads')
    .eq('id', parsed.horseId)
    .single();
  if (readError) throw new Error(readError.message);

  const uploads = (horse.document_uploads ?? []) as { requirementId?: string; verified?: boolean }[];
  const next = uploads.map((u) =>
    u.requirementId === parsed.requirementId ? { ...u, verified: parsed.verified } : u
  );

  const { error } = await supabase
    .from('horses')
    .update({ document_uploads: next })
    .eq('id', parsed.horseId);
  if (error) throw new Error(error.message);

  revalidatePath(HORSES_PATH);
}

/**
 * Sends the missing-documents reminder — a direct call to Resend's REST API,
 * from `notifications@field-arena.com`, the same verified domain the
 * Supabase Auth SMTP invite path already sends from. There is no generic
 * email infrastructure in this codebase yet (no src/shared/lib/emails/); this
 * is deliberately a one-off, not a template system for a single email.
 *
 * Not exported — 'use server' files may only export async functions
 * (layers.md), so this stays a private helper for remindHorseDocuments below.
 */
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

/**
 * "✉ Remind" — one click, listing exactly which documents are still missing
 * for one horse. Ported from api/shows/[id]/[resource].js's
 * 'remind-documents' POST (~678-713), with the missing-document list
 * recomputed here from the horse's own record rather than trusted from the
 * client — a real difference from the legacy route, which took
 * riderEmail/riderName/horseName/missingLabels straight from the request
 * body. Only a horse with a real horses row can be reminded: a roster entry
 * or manually-added horse has no document_uploads to check missing docs
 * against in the first place (see horses-queries.ts's module doc comment),
 * which the UI reflects by disabling the button rather than this throwing.
 */
export async function remindHorseDocuments(input: unknown): Promise<{ ok: true }> {
  const parsed = remindHorseDocumentsSchema.parse(input);
  const supabase = await createServerClient();

  const [showResult, horseResult] = await Promise.all([
    supabase.from('shows').select('name, document_requirements').eq('id', parsed.showId).single(),
    supabase.from('horses').select('name, document_uploads, rider_id').eq('id', parsed.horseId).single(),
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
    (r) => r.label.trim() && !uploads.some((u) => u.requirementId === r.id)
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
