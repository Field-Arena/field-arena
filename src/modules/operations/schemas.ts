import { z } from 'zod';

/**
 * ShowStaff's one write path, ported from showstaff-ops.html's uploadVolDoc():
 * a PDF uploaded to the show's shared document library (Vercel Blob there,
 * Supabase Storage's `documents` bucket here — see data/mutations.ts). The
 * legacy screen filtered to `file.type === 'application/pdf'` client-side
 * before ever reading the file; `contentType` being a literal enforces the
 * same rule server-side, where it actually matters.
 */
export const uploadShowDocumentSchema = z.object({
  showId: z.uuid(),
  name: z.string().min(1).max(200),
  dataBase64: z.string().min(1),
  contentType: z.literal('application/pdf'),
});

export type UploadShowDocumentInput = z.infer<typeof uploadShowDocumentSchema>;
