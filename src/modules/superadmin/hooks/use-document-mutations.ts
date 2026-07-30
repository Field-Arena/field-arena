'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  uploadCatalogDocument,
  deleteCatalogDocument,
  moveCatalogDocument,
} from '../data/mutations';
import type { UploadDocumentInput } from '../schemas';

/**
 * Document mutation hooks. Toasts and refreshes live here per layers.md; each
 * server action revalidates the documents path and router.refresh pulls the
 * re-rendered list into view.
 */

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function useUploadDocument(options?: { onSuccess?: () => void }) {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: UploadDocumentInput) => uploadCatalogDocument(input),
    onSuccess: () => {
      toast.success('File uploaded');
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Could not upload the file'));
    },
  });
}

export function useDeleteDocument(options?: { onSuccess?: () => void }) {
  const router = useRouter();

  return useMutation({
    mutationFn: (id: string) => deleteCatalogDocument({ id }),
    onSuccess: () => {
      toast.success('File deleted');
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Could not delete the file'));
    },
  });
}

export function useMoveDocument() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: { id: string; folder: string }) => moveCatalogDocument(input),
    onSuccess: () => {
      toast.success('Moved to Documents');
      router.refresh();
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Could not move the file'));
    },
  });
}
