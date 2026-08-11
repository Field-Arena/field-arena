'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  createOrganization,
  updateOrganization,
  setOrganizationSuspended,
  setOrganizationDeleted,
  resendOrganizerInvite,
} from '../data/mutations';
import type { CreateOrganizationInput, UpdateOrganizationInput } from '../schemas';
import { readableError } from '@/shared/lib/error-message';

/**
 * Mutation hooks for the console.
 *
 * Toasts and navigation live here rather than in the UI components, per
 * layers.md. Each action calls revalidatePath server-side, so the table
 * re-renders from fresh data without any manual cache invalidation — router
 * refresh is only needed where the mutation can change what the current page
 * should show at all.
 */

function errorMessage(error: unknown, fallback: string): string {
  return readableError(error, fallback);
}

export function useCreateOrganization(options?: { onSuccess?: () => void }) {
  return useMutation({
    // The action returns a typed result rather than throwing (see mutations.ts /
    // BUG-API-001). Re-throw here on failure so the existing onError/toast path
    // still fires — now with the real, actionable message.
    mutationFn: async (input: CreateOrganizationInput) => {
      const result = await createOrganization(input);
      if (!result.ok) throw new Error(result.error);
      return result;
    },
    onSuccess: ({ name }) => {
      toast.success(`${name} added. Its owner invite is pending.`);
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Could not add this organizer'));
    },
  });
}

export function useUpdateOrganization(options?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: (input: UpdateOrganizationInput) => updateOrganization(input),
    onSuccess: () => {
      toast.success('Changes saved');
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Could not save changes'));
    },
  });
}

export function useSetOrganizationSuspended() {
  return useMutation({
    mutationFn: (input: { id: string; value: boolean }) => setOrganizationSuspended(input),
    onSuccess: (_data, { value }) => {
      toast.success(
        value
          ? 'Organizer suspended — their shows are now invisible to riders'
          : 'Organizer reactivated — riders can purchase again'
      );
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Could not change suspension'));
    },
  });
}

export function useSetOrganizationDeleted() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: { id: string; value: boolean }) => setOrganizationDeleted(input),
    onSuccess: (_data, { value }) => {
      toast.success(
        value
          ? 'Organizer deleted. Their shows and history are kept, not erased.'
          : 'Organizer restored'
      );
      router.refresh();
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Could not delete this organizer'));
    },
  });
}

export function useResendOrganizerInvite() {
  return useMutation({
    mutationFn: (orgId: string) => resendOrganizerInvite({ orgId }),
    onSuccess: ({ email }) => {
      toast.success(`Invite re-sent to ${email}`);
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Could not resend the invite'));
    },
  });
}
