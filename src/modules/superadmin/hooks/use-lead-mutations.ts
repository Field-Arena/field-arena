'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createLead, updateLead, sendLeadOnboarding } from '@/modules/superadmin/data/mutations';
import type { CreateLeadInput, UpdateLeadInput } from '@/modules/superadmin/schemas';
import { readableError } from '@/shared/lib/error-message';

/**
 * Sales-funnel mutation hooks. Toasts and refreshes live here per layers.md; each
 * server action revalidates its paths, and router.refresh pulls the re-rendered
 * funnel/detail back into view.
 */

function errorMessage(error: unknown, fallback: string): string {
  return readableError(error, fallback);
}

export function useCreateLead(options?: { onSuccess?: (id: string) => void }) {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: CreateLeadInput) => createLead(input),
    onSuccess: ({ id }) => {
      toast.success('Target added to the funnel.');
      router.refresh();
      options?.onSuccess?.(id);
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Could not add this target'));
    },
  });
}

export function useUpdateLead(options?: { successMessage?: string; onSuccess?: () => void }) {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: UpdateLeadInput) => updateLead(input),
    onSuccess: () => {
      toast.success(options?.successMessage ?? 'Saved');
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Could not save changes'));
    },
  });
}

export function useSendLeadOnboarding() {
  const router = useRouter();

  return useMutation({
    mutationFn: (id: string) => sendLeadOnboarding({ id }),
    onSuccess: ({ emailSent }) => {
      toast.success(
        emailSent
          ? 'Onboarding email sent.'
          : 'Checklist seeded. No email was sent — the email provider is not configured yet.'
      );
      router.refresh();
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Could not send onboarding'));
    },
  });
}
