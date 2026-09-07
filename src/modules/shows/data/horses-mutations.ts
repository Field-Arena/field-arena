'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/shared/lib/supabase/server';
import { env } from '@/shared/lib/env';
import type { Json } from '@/shared/types/database.types';
import {
  addManualHorseSchema,
  verifyHorseDocumentSchema,
  remindHorseDocumentsSchema,
} from '@/modules/shows/schemas';
import { HORSES_PATH } from '@/modules/shows/constants';
import type { ManualHorseEntry } from '@/modules/shows/data/horses-queries';
import type { DocumentRequirement } from '@/modules/shows/data/setup-queries';

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
    .update({ manual_horses: [...current, entry] as unknown as Json })
    .eq('id', parsed.showId);
  if (error) throw new Error(error.message);

  revalidatePath(HORSES_PATH);
  return { id: entry.id };
}

export async function verifyHorseDocument(input: unknown): Promise<void> {
  const parsed = verifyHorseDocumentSchema.parse(input);
  const supabase = await createServerClient();

  const { data: horse, error: readError } = await supabase
    .from('horses')
    .select('document_uploads')
    .eq('id', parsed.horseId)
    .single();
  if (readError) throw new Error(readError.message);

  const uploads = (horse.document_uploads ?? []) as {
    requirementId?: string;
    verified?: boolean;
    expirationDate?: string | null;
  }[];
  /* Legacy allowed an organizer to correct a rider-entered expiry typo through
   * this same route, patching only the fields present in the body
   * (verify-horse-document, api/rider/[resource].js). Spreading the parsed
   * fields conditionally keeps that: a verified-only call leaves the stored
   * date alone, and a date-only correction leaves verification alone. */
  const next = uploads.map((u) =>
    u.requirementId === parsed.requirementId
      ? {
          ...u,
          ...(parsed.verified !== undefined ? { verified: parsed.verified } : {}),
          ...(parsed.expirationDate !== undefined
            ? { expirationDate: parsed.expirationDate }
            : {}),
        }
      : u,
  );

  const { error } = await supabase
    .from('horses')
    .update({ document_uploads: next })
    .eq('id', parsed.horseId);
  if (error) throw new Error(error.message);

  revalidatePath(HORSES_PATH);
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
  const parsed = remindHorseDocumentsSchema.parse(input);
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
