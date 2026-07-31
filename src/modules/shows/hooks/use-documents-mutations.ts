'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { uploadShowDocument, removeShowDocument, updateDocumentEvents } from '../data/mutations';
import type { UploadShowDocumentInput, RemoveShowDocumentInput, UpdateDocumentEventsInput } from '../schemas';

function message(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function useUploadShowDocument() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: UploadShowDocumentInput) => uploadShowDocument(input),
    onSuccess: () => {
      toast.success('File uploaded');
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not upload this file'));
    },
  });
}

export function useRemoveShowDocument() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: RemoveShowDocumentInput) => removeShowDocument(input),
    onSuccess: () => {
      toast.success('File removed');
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not remove this file'));
    },
  });
}

export function useUpdateDocumentEvents() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: UpdateDocumentEventsInput) => updateDocumentEvents(input),
    onSuccess: () => {
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not update which classes this is attached to'));
    },
  });
}
