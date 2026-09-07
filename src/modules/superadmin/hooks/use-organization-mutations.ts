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
  resendAllPendingOrganizerInvites,
  addOrganizationOwner,
  removeOrganizationOwner,
} from '@/modules/superadmin/data/mutations';
import type {
  CreateOrganizationInput,
  UpdateOrganizationInput,
  AddOrganizationOwnerInput,
} from '@/modules/superadmin/schemas';
import { readableError } from '@/shared/lib/error-message';

function errorMessage(error: unknown, fallback: string): string {
  return readableError(error, fallback);
}

export function useCreateOrganization(options?: { onSuccess?: () => void }) {
  return useMutation({
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
          : 'Organizer reactivated — riders can purchase again',
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
          : 'Organizer restored',
      );
      router.refresh();
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Could not delete this organizer'));
    },
  });
}

export function useAddOrganizationOwner(options?: { onSuccess?: () => void }) {
  const router = useRouter();

  return useMutation({
    mutationFn: async (input: AddOrganizationOwnerInput) => {
      const result = await addOrganizationOwner(input);
      if (!result.ok) throw new Error(result.error);
      return result;
    },
    onSuccess: ({ email }) => {
      toast.success(`${email} can now switch into this organization`);
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Could not grant access'));
    },
  });
}

export function useRemoveOrganizationOwner() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: { orgId: string; userId: string }) => removeOrganizationOwner(input),
    onSuccess: () => {
      toast.success('Access removed');
      router.refresh();
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Could not remove access'));
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

/* Bulk resend reports per-org outcomes rather than a single ok/failed, because
 * a partial send is the normal case — legacy summarised exactly this way
 * ("N of M sent", plus the names that failed). */
export function useResendAllPendingInvites(options?: { onSuccess?: () => void }) {
  const router = useRouter();

  return useMutation({
    mutationFn: () => resendAllPendingOrganizerInvites(),
    onSuccess: ({ sent, total, failed }) => {
      const plural = total === 1 ? '' : 's';
      if (failed.length > 0) {
        toast.warning(`${String(sent)} of ${String(total)} invite${plural} sent`, {
          description: `Failed: ${failed.join(', ')}`,
        });
      } else {
        toast.success(`${String(sent)} of ${String(total)} invite${plural} sent`);
      }
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Could not resend the pending invites'));
    },
  });
}
