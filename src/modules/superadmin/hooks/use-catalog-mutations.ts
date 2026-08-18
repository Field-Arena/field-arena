'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  createScoringSheet,
  updateScoringSheet,
  deleteScoringSheet,
} from '@/modules/superadmin/data/mutations';
import type { CreateSheetInput, UpdateSheetInput } from '@/modules/superadmin/schemas';
import { readableError } from '@/shared/lib/error-message';

/**
 * Scoring-catalog mutation hooks. Toasts and refreshes live here per layers.md;
 * each server action revalidates the catalog paths and router.refresh pulls the
 * re-rendered list/detail into view.
 */

function errorMessage(error: unknown, fallback: string): string {
  return readableError(error, fallback);
}

export function useCreateScoringSheet(options?: { onSuccess?: (id: string) => void }) {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: CreateSheetInput) => createScoringSheet(input),
    onSuccess: ({ id }) => {
      toast.success('Sheet stub created.');
      router.refresh();
      options?.onSuccess?.(id);
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Could not create the sheet'));
    },
  });
}

export function useUpdateScoringSheet(options?: { onSuccess?: () => void }) {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: UpdateSheetInput) => updateScoringSheet(input),
    onSuccess: () => {
      toast.success('Sheet saved');
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Could not save the sheet'));
    },
  });
}

export function useDeleteScoringSheet(options?: { onSuccess?: () => void }) {
  const router = useRouter();

  return useMutation({
    mutationFn: (id: string) => deleteScoringSheet({ id }),
    onSuccess: () => {
      toast.success('Sheet removed');
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Could not remove the sheet'));
    },
  });
}
