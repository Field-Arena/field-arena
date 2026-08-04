'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updateClassReview, removeClass } from '../data/mutations';
import type { UpdateClassReviewInput, RemoveClassInput } from '../schemas';
import { readableError } from '@/shared/lib/error-message';

function message(error: unknown, fallback: string): string {
  return readableError(error, fallback);
}

export function useUpdateClassReview() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: UpdateClassReviewInput) => updateClassReview(input),
    onSuccess: () => {
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not save this class'));
    },
  });
}

export function useRemoveClass() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: RemoveClassInput) => removeClass(input),
    onSuccess: () => {
      toast.success('Class removed');
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not remove this class'));
    },
  });
}
