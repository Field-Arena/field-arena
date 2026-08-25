'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { setClassPanel } from '@/modules/judging/data/mutations';
import type { SetClassPanelInput } from '@/modules/judging/schemas';

export function useSetClassPanel() {
  return useMutation({
    mutationFn: (input: SetClassPanelInput) => setClassPanel(input),
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : 'Could not save the panel'),
  });
}
