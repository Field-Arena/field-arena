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
    await supabase.storage.from('documents').remove([path]);
    throw new Error(error.message);
  }

  revalidatePath(OPERATIONS_DOCUMENTS_PATH);
}
