'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import { saveShowExpenses } from '@/modules/shows/data/mutations';
import type { SaveShowExpensesInput } from '@/modules/shows/schemas';

export function useSaveShowExpenses() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: SaveShowExpensesInput) => saveShowExpenses(input),
    onSuccess: () => {
      router.refresh();
    },
    onError: (error) => {
      toast.error(readableError(error, "Couldn't save that expense — try again."));
    },
  });
}
