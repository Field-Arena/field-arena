'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateSettlement } from '../data/mutations';
import type { UpdateSettlementInput } from '../schemas';

export function useUpdateSettlement() {
  return useMutation({
    mutationFn: (input: UpdateSettlementInput) => updateSettlement(input),
    onSuccess: () => {
      toast.success('Settlement settings saved.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Could not save settings');
    },
  });
}
