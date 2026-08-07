'use server';
import { createServerClient } from '@/shared/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { uploadShowDocumentSchema } from '../schemas';

/**
 * ShowStaff's one write path — uploading a PDF to the show's shared document
 * library. Ported from showstaff-ops.html's uploadVolDoc(), which posted to
 * `/api/shows/:id/documents`; the legacy `[resource].js` handler explicitly
 * allowed POST here for `showRole === 'ShowStaff'` while every other staff
 * write on that endpoint 403'd. Removal stays organizer-only, same as
 * legacy's comment on the missing Remove button in real mode — no delete
 * mutation exists in this module on purpose.
 *
 * Same real-Storage-upload-then-row-insert pattern as
 * `modules/shows/data/mutations.ts`'s `uploadShowBranding`: the file arrives
 * base64-encoded because Server Action bodies can't carry a raw File.
 */
export async function uploadShowDocument(input: unknown): Promise<void> {
  const parsed = uploadShowDocumentSchema.parse(input);
  const supabase = await createServerClient();

  const bytes = Buffer.from(parsed.dataBase64, 'base64');
  const safeName = parsed.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${parsed.showId}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from('documents').upload(path, bytes, {
    contentType: parsed.contentType,
    upsert: false,
  });
  if (uploadError) throw new Error(uploadError.message);

  const { error } = await supabase.from('documents').insert({
    show_id: parsed.showId,
    name: parsed.name,
    path,
  });
  if (error) {
    // Don't leave an orphaned object if the row insert fails.
    await supabase.storage.from('documents').remove([path]);
    throw new Error(error.message);
  }

  revalidatePath('/dashboard/operations/documents');
}
