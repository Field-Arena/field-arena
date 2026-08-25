import { z } from 'zod';

export const uploadShowDocumentSchema = z.object({
  showId: z.uuid(),
  name: z.string().min(1).max(200),
  dataBase64: z.string().min(1),
  contentType: z.literal('application/pdf'),
});

export type UploadShowDocumentInput = z.infer<typeof uploadShowDocumentSchema>;
