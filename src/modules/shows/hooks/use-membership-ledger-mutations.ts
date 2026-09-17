'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import {
  linkMembershipRecord,
  updateMembershipCheck,
  setMembershipVerificationStatus,
} from '@/modules/shows/data/membership-ledger-mutations';
import type {
  LinkMembershipRecordInput,
  UpdateMembershipCheckInput,
  SetMembershipVerificationStatusInput,
} from '@/modules/shows/schemas';

export function useLinkMembershipRecord() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: LinkMembershipRecordInput) => linkMembershipRecord(input),
    onSuccess: () => {
      toast.success('Membership record linked');
      router.refresh();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not link that membership record'));
    },
  });
}

export function useUpdateMembershipCheck(options?: { onSuccess?: () => void }) {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: UpdateMembershipCheckInput) => updateMembershipCheck(input),
    onSuccess: () => {
      toast.success('Membership check saved');
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not save the membership check'));
    },
  });
}

export function useSetMembershipVerificationStatus() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: SetMembershipVerificationStatusInput) =>
      setMembershipVerificationStatus(input),
    onSuccess: () => {
      router.refresh();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not update verification status'));
    },
  });
}
