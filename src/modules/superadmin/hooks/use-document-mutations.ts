'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  uploadCatalogDocument,
  deleteCatalogDocument,
  moveCatalogDocument,
  moveCatalogDocuments,
  rematchCatalogDocuments,
} from '@/modules/superadmin/data/mutations';
import type { UploadDocumentInput } from '@/modules/superadmin/schemas';
import { readableError } from '@/shared/lib/error-message';

function errorMessage(error: unknown, fallback: string): string {
  return readableError(error, fallback);
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

/* Bulk "Move all non-matching to Documents" — refiles every upload that isn't
 * a test sheet in one pass instead of one click each. */
export function useMoveDocuments() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: { ids: string[]; folder: string }) => moveCatalogDocuments(input),
    onSuccess: ({ moved }) => {
      toast.success(`${String(moved)} file${moved === 1 ? '' : 's'} moved to Documents`);
      router.refresh();
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Could not move those files'));
    },
  });
}

/* "Try to match again" — renames already-uploaded rows onto the catalog sheet
 * they now match, with no re-upload. */
export function useRematchDocuments() {
  const router = useRouter();

  return useMutation({
    mutationFn: (renames: { id: string; name: string }[]) => rematchCatalogDocuments({ renames }),
    onSuccess: ({ fixed, failed }) => {
      const base = `${String(fixed)} file${fixed === 1 ? '' : 's'} matched and fixed`;
      if (failed > 0) toast.warning(`${base}. ${String(failed)} failed.`);
      else toast.success(base);
      router.refresh();
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Could not re-match those files'));
    },
  });
}
