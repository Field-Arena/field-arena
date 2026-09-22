'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';

/* The standard mutation-hook shape across this app calls `toast.success()`
 * then `router.refresh()` in onSuccess, neither awaited. router.refresh()
 * is fire-and-forget — it gives the caller no pending signal — so a
 * button's own isPending (tied only to the Server Action call) clears,
 * and the toast fires, before the background refetch+re-render it
 * triggers has actually landed. The screen looks done before it is.
 *
 * Wrapping router.refresh() in useTransition gives a real isPending that
 * stays true for the Server Action AND the refetch/re-render it causes —
 * any button already keyed off isPending now stays disabled/spinning for
 * the entire real duration, not just the network call. */
export function useRefreshingMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    successMessage?: string | ((data: TData, variables: TVariables) => string);
    errorFallback?: string;
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: unknown) => void;
  },
) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();

  const mutation = useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      startTransition(() => {
        router.refresh();
      });
      if (options?.successMessage) {
        toast.success(
          typeof options.successMessage === 'function'
            ? options.successMessage(data, variables)
            : options.successMessage,
        );
      }
      options?.onSuccess?.(data, variables);
    },
    onError: (error) => {
      toast.error(readableError(error, options?.errorFallback ?? 'Something went wrong'));
      options?.onError?.(error);
    },
  });

  return { ...mutation, isPending: mutation.isPending || isRefreshing };
}
