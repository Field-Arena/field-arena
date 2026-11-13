'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/shared/lib/supabase/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { env } from '@/shared/lib/env';
import { parseInput } from '@/shared/lib/action-result';
import { ROUTES } from '@/shared/constants/routes';
import type { Json } from '@/shared/types/database.types';
import { getStaffProfile } from '@/modules/auth/data/queries';
import { horseUsefDetailsSchema } from '@/modules/riders/schemas';
import {
  decideHorseEditAccess,
  parseUsefMeta,
  stampChangedFields,
  type UsefFieldMeta,
} from '@/modules/riders/utils/horse-usef-meta';
import { usefColumnUpdates } from '@/modules/riders/utils/horse-usef-updates';
import {
  addManualHorseSchema,
  verifyHorseDocumentSchema,
  remindHorseDocumentsSchema,
  reviewHorseDocumentSchema,
} from '@/modules/shows/schemas';
import { HORSES_PATH, DOCUMENTS_PATH } from '@/modules/shows/constants';
import type { ManualHorseEntry } from '@/modules/shows/data/horses-queries';
import type { DocumentRequirement } from '@/modules/shows/data/setup-queries';

export async function addManualHorse(input: unknown): Promise<{ id: string }> {
  const parsed = parseInput(addManualHorseSchema, input);
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
  const parsed = parseInput(verifyHorseDocumentSchema, input);
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
    status?: string;
    expirationDate?: string | null;
  }[];
  /* Legacy allowed an organizer to correct a rider-entered expiry typo through
   * this same route, patching only the fields present in the body
   * (verify-horse-document, api/rider/[resource].js). Spreading the parsed
   * fields conditionally keeps that: a verified-only call leaves the stored
   * date alone, and a date-only correction leaves verification alone.
   * `status` is kept in sync with `verified` so the newer review workflow
   * (reviewHorseDocument) reads a consistent status for rows only ever
   * touched through this older checkbox route. */
  const next = uploads.map((u) =>
    u.requirementId === parsed.requirementId
      ? {
          ...u,
          ...(parsed.verified !== undefined
            ? { verified: parsed.verified, status: parsed.verified ? 'approved' : 'pending' }
            : {}),
          ...(parsed.expirationDate !== undefined ? { expirationDate: parsed.expirationDate } : {}),
        }
      : u,
  );

  const { error } = await supabase
    .from('horses')
    .update({ document_uploads: next })
    .eq('id', parsed.horseId);
  if (error) throw new Error(error.message);

  revalidatePath(HORSES_PATH);
  revalidatePath(DOCUMENTS_PATH);
}

export async function reviewHorseDocument(input: unknown): Promise<void> {
  const parsed = parseInput(reviewHorseDocumentSchema, input);
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
    status?: string;
    rejectionReason?: string;
    rejectionNote?: string;
    replacementRequestedAt?: string;
    reviewedAt?: string;
  }[];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const now = new Date().toISOString();

  const next = uploads.map((u) => {
    if (u.requirementId !== parsed.requirementId) return u;
    return {
      ...u,
      status: parsed.status,
      verified: parsed.status === 'approved',
      rejectionReason: parsed.status === 'rejected' ? parsed.rejectionReason : undefined,
      rejectionNote: parsed.status === 'rejected' ? parsed.rejectionNote : undefined,
      replacementRequestedAt: parsed.status === 'replacement_requested' ? now : undefined,
      reviewedAt: now,
      reviewedBy: user?.id,
    };
  });

  const { error } = await supabase
    .from('horses')
    .update({ document_uploads: next })
    .eq('id', parsed.horseId);
  if (error) throw new Error(error.message);

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

/* An organizer (or Show Admin) saving a horse's USEF details.
 *
 * Horses belong to riders and carry from show to show, so this edits the horse
 * everywhere, and the rider sees it on their own form. It is allowed only for a
 * horse entered in a show where the caller has the approve-documents grant (the
 * grant organizers, org owners and Show Admins hold, and the one the document
 * review policy uses). Each field that really changed is stamped with who changed
 * it and when. */
export async function updateHorseUsefDetails(
  input: unknown,
): Promise<{ ok: true; meta: UsefFieldMeta }> {
  const parsed = parseInput(horseUsefDetailsSchema, input);
  const supabase = await createServerClient();

  const profile = await getStaffProfile();
  if (!profile) throw new Error('Not signed in.');

  const { data: horse, error: readError } = await supabase
    .from('horses')
    .select(
      'id, usef_field_meta, usef_number, fei_number, passport_number, registration_number, year_of_birth, breed, owner_name, owner_email, owner_usef, owner_usef_exempt_reason, owner_street, owner_city, owner_state, owner_zip, trainer, trainer_phone, trainer_usef, trainer_street, trainer_city, trainer_state, trainer_zip',
    )
    .eq('id', parsed.horseId)
    .maybeSingle();
  if (readError) throw readError;
  if (!horse) throw new Error('Horse not found.');

  // The shows this horse is entered in.
  const { data: entries, error: entriesError } = await supabase
    .from('class_entries')
    .select('class_id')
    .eq('horse_id', parsed.horseId);
  if (entriesError) throw entriesError;
  const classIds = [...new Set(entries.map((entry) => entry.class_id))];
  let showIds: string[] = [];
  if (classIds.length > 0) {
    const { data: classes, error: classError } = await supabase
      .from('classes')
      .select('show_id')
      .in('id', classIds);
    if (classError) throw classError;
    showIds = [...new Set(classes.map((c) => c.show_id))];
  }

  const grants = await Promise.all(
    showIds.map(async (showId) => {
      const { data, error } = await supabase.rpc('has_show_permission', {
        target_show_id: showId,
        permission_key: 'canApproveDocuments',
      });
      if (error) throw error;
      return { allowed: data };
    }),
  );
  const access = decideHorseEditAccess(grants);
  if (access === 'not-entered') throw new Error("This horse isn't entered in any of your shows.");
  if (access === 'denied') {
    throw new Error("You don't have permission to edit this horse's details.");
  }

  const updates = usefColumnUpdates(parsed);
  const meta = stampChangedFields(horse, updates, parseUsefMeta(horse.usef_field_meta), {
    source: 'organizer',
    by: profile.name,
    byId: profile.id,
    at: new Date().toISOString(),
  });

  // horses' own triggers let only the rider (or the server) change anything but
  // document review, so this write goes through the admin client. That bypasses
  // RLS, which is why the access check above is the real gate: it ran as the
  // signed-in user, against the shows this horse is entered in.
  const admin = createAdminClient();
  const { data: saved, error } = await admin
    .from('horses')
    .update({ ...updates, usef_field_meta: meta as Json })
    .eq('id', parsed.horseId)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!saved) throw new Error('Horse not found.');

  revalidatePath(HORSES_PATH);
  revalidatePath(ROUTES.rider);
  return { ok: true, meta };
}
