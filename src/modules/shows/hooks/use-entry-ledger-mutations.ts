'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import {
  updateEntryNumber,
  updateBridleNumber,
  updateBackNumber,
} from '@/modules/shows/data/entry-ledger-mutations';
import type {
  UpdateEntryNumberInput,
  UpdateBridleNumberInput,
  UpdateBackNumberInput,
} from '@/modules/shows/schemas';

export function useUpdateEntryNumber() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: UpdateEntryNumberInput) => updateEntryNumber(input),
    onSuccess: () => {
      toast.success('Entry number updated');
      router.refresh();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not update the entry number'));
    },
  });
}

export function useUpdateBridleNumber() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: UpdateBridleNumberInput) => updateBridleNumber(input),
    onSuccess: () => {
      toast.success('Bridle number updated');
      router.refresh();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not update the bridle number'));
    },
  });
}

export function useUpdateBackNumber() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: UpdateBackNumberInput) => updateBackNumber(input),
    onSuccess: () => {
      toast.success('Back number updated');
      router.refresh();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not update the back number'));
    },
  });
}
