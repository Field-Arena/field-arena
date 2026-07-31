'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  createOrganization,
  updateOrganization,
  setOrganizationSuspended,
  setOrganizationDeleted,
  refreshPendingInvites,
} from '../data/mutations';
import type { CreateOrganizationInput, UpdateOrganizationInput } from '../schemas';
import { INVITE_TTL_DAYS } from '../constants';

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
  return error instanceof Error ? error.message : fallback;
}

export function useCreateOrganization(options?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: (input: CreateOrganizationInput) => createOrganization(input),
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

export function useRefreshPendingInvites() {
  return useMutation({
    mutationFn: () => refreshPendingInvites(),
    onSuccess: ({ refreshed, emailSent }) => {
      if (refreshed === 0) {
        toast.info('No invites are outstanding.');
        return;
      }
      // Deliberately precise: the rows were refreshed, but nothing was emailed.
      // Saying "invites sent" would be a lie while RESEND_API_KEY is unset.
      toast.success(
        emailSent
          ? `${String(refreshed)} invite${refreshed === 1 ? '' : 's'} re-sent`
          : `${String(refreshed)} invite${refreshed === 1 ? '' : 's'} extended by ${String(INVITE_TTL_DAYS)} days. No email was sent — the email provider is not configured yet.`
      );
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Could not refresh invites'));
    },
  });
}
