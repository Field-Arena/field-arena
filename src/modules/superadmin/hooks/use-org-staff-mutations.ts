'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import {
  addOrgStaff,
  changeStaffRole,
  updateStaffPermissions,
  removeStaffAssignment,
} from '@/modules/superadmin/data/mutations';
import type {
  AddOrgStaffInput,
  ChangeStaffRoleInput,
  UpdateStaffPermissionsInput,
} from '@/modules/superadmin/schemas';

function errorMessage(error: unknown, fallback: string): string {
  return readableError(error, fallback);
}

export function useAddOrgStaff(options?: { onSuccess?: () => void }) {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: AddOrgStaffInput) => addOrgStaff(input),
    onSuccess: ({ email, emailSent }) => {
      // The staff row is real either way, but "added" without "invited" is a
      // person who will never receive the link — say which happened.
      if (emailSent) toast.success(`Invite sent to ${email}.`);
      else
        toast.warning(`${email} was added to the show's staff, but the invite email failed`, {
          description: 'Their record is saved — send them the login link another way, or retry.',
        });
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Could not add this staff member'));
    },
  });
}

export function useChangeStaffRole() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: ChangeStaffRoleInput) => changeStaffRole(input),
    onSuccess: () => {
      toast.success('Role updated');
      router.refresh();
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Could not change the role'));
    },
  });
}

export function useUpdateStaffPermissions(options?: { onSuccess?: () => void }) {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: UpdateStaffPermissionsInput) => updateStaffPermissions(input),
    onSuccess: () => {
      toast.success('Permissions saved');
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Could not save permissions'));
    },
  });
}

export function useRemoveStaffAssignment(options?: { onSuccess?: () => void }) {
  const router = useRouter();

  return useMutation({
    mutationFn: (staffId: string) => removeStaffAssignment({ staffId }),
    onSuccess: () => {
      toast.success('Staff member removed');
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Could not remove this staff member'));
    },
  });
}
