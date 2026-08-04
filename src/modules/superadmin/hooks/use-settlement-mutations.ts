'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateSettlement } from '../data/mutations';
import type { UpdateSettlementInput } from '../schemas';
import { readableError } from '@/shared/lib/error-message';

export function useUpdateSettlement() {
  return useMutation({
    mutationFn: (input: UpdateSettlementInput) => updateSettlement(input),
    onSuccess: () => {
      toast.success('Settlement settings saved.');
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not save settings'));
    },
  });
}
