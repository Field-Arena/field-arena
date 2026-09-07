'use server';
import { createServerClient } from '@/shared/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { uploadShowDocumentSchema } from '@/modules/operations/schemas';
import { OPERATIONS_DOCUMENTS_PATH } from '@/modules/operations/constants';

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
    // Best-effort cleanup only — it is expected to fail for the very role this
    // action exists to serve. ShowStaff is granted INSERT on documents and
    // nothing else (documents_insert_showstaff, 20260806150000), and the
    // storage policy fa_documents_write gates removal behind
    // USING (has_show_permission(..., 'canEditShow')), which ShowStaff's empty
    // permission defaults never satisfy. Legacy drew the same line on purpose
    // ("Removal is organizer-only server-side", showstaff-ops.html:919).
    //
    // So this is wrapped rather than awaited bare: a denied or failing cleanup
    // must never replace the insert error the caller actually needs to see.
    // The cost of the denial is an orphaned object in the bucket with no row
    // pointing at it — invisible to every read path, which lists from the
    // documents table, but it does accumulate. Tracked in
    // docs/parity-findings.md under "Orphaned document blobs".
    try {
      // supabase-js storage RETURNS an { error } on an RLS denial rather than
      // throwing, so the common failure here is this discarded value, not the
      // catch below. Both are dropped on purpose: the insert error is what the
      // caller needs, and a failed cleanup must never replace it.
      const { error: cleanupError } = await supabase.storage
        .from('documents')
        .remove([path]);
      if (cleanupError) {
        console.warn(
          '[operations] orphaned document blob left in storage (cleanup denied or failed)',
          { path, reason: cleanupError.message },
        );
      }
    } catch (cleanupThrow) {
      console.warn('[operations] document cleanup threw; blob left in storage', {
        path,
        cleanupThrow,
      });
    }
    throw new Error(error.message);
  }

  revalidatePath(OPERATIONS_DOCUMENTS_PATH);
}
