'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { completeOrganizationProfile } from '@/modules/organizations/data/mutations';
import type { CompleteOrgProfileInput } from '@/modules/organizations/schemas';

export function useCompleteOrgProfile() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: CompleteOrgProfileInput) => completeOrganizationProfile(input),
    onSuccess: () => {
      router.push('/dashboard');

      router.refresh();
    },
  });
}
