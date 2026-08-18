'use client';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { uploadShowDocument } from '@/modules/operations/data/mutations';
import type { UploadShowDocumentInput } from '@/modules/operations/schemas';

/** Wraps the upload Server Action for the Documents tab's file input. */
export function useUploadShowDocument() {
  return useMutation({
    mutationFn: (input: UploadShowDocumentInput) => uploadShowDocument(input),
    onSuccess: () => toast.success('Document uploaded'),
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Didn't upload — check your connection and try again."),
  });
}
