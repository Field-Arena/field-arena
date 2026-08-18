'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { completeOrganizationProfile } from '@/modules/organizations/data/mutations';
import type { CompleteOrgProfileInput } from '@/modules/organizations/schemas';

/**
 * Onboarding submit.
 *
 * No toast: the whole screen is the interaction, and success navigates straight
 * into the workspace — a toast would fire against a page that is already gone.
 * Errors render inline beside the button, which is where the design puts them.
 */
export function useCompleteOrgProfile() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: CompleteOrgProfileInput) => completeOrganizationProfile(input),
    onSuccess: () => {
      router.push('/dashboard');
      // The onboarding gate is a Server Component read; without this the cached
      // pre-submit render can send the organizer straight back here.
      router.refresh();
    },
  });
}
