'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { saveTestTemplate, deleteTestTemplate } from '../data/mutations';
import type { SaveTestTemplateInput } from '../schemas';
import { readableError } from '@/shared/lib/error-message';

function message(error: unknown, fallback: string): string {
  return readableError(error, fallback);
}

export function useSaveTestTemplate(options?: { onSuccess?: (id: string) => void }) {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: SaveTestTemplateInput) => saveTestTemplate(input),
    onSuccess: ({ id }, variables) => {
      toast.success(variables.id ? 'Test saved' : 'Test created');
      router.refresh();
      options?.onSuccess?.(id);
    },
    onError: (error) => {
      toast.error(message(error, 'Could not save this test'));
    },
  });
}

export function useDeleteTestTemplate() {
  const router = useRouter();

  return useMutation({
    mutationFn: (id: string) => deleteTestTemplate(id),
    onSuccess: () => {
      toast.success('Test deleted');
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not delete this test'));
    },
  });
}
