'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import {
  addManualIssue,
  resolveIssue,
  markEntryCleared,
  updateShowEntryStatus,
} from '@/modules/shows/data/entry-issues-mutations';
import type {
  AddManualIssueInput,
  ResolveIssueInput,
  MarkEntryClearedInput,
  UpdateShowEntryStatusInput,
} from '@/modules/shows/schemas';

export function useAddManualIssue(options?: { onSuccess?: () => void }) {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: AddManualIssueInput) => addManualIssue(input),
    onSuccess: () => {
      toast.success('Added');
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not add that'));
    },
  });
}

export function useResolveIssue(options?: { onSuccess?: () => void }) {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: ResolveIssueInput) => resolveIssue(input),
    onSuccess: () => {
      toast.success('Resolved');
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not resolve this issue'));
    },
  });
}

export function useMarkEntryCleared() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: MarkEntryClearedInput) => markEntryCleared(input),
    onSuccess: () => {
      toast.success('Entry cleared to compete');
      router.refresh();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not clear this entry'));
    },
  });
}

export function useUpdateShowEntryStatus() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: UpdateShowEntryStatusInput) => updateShowEntryStatus(input),
    onSuccess: () => {
      router.refresh();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not update the entry status'));
    },
  });
}
