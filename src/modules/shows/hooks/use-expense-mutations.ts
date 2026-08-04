'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import { saveShowExpenses } from '../data/mutations';
import type { SaveShowExpensesInput } from '../schemas';

/**
 * The Financial tab's expense editor.
 *
 * Silent on success like the rest of the autosaving cards — the row the
 * organizer just edited already shows its new value, and a toast per keystroke-
 * ending blur would be noise. Failures still speak up.
 */
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

