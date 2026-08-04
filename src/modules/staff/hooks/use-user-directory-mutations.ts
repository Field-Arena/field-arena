'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import { unwrap } from '@/shared/lib/unwrap-action';
import {
  addStaffUser,
  changeStaffRole,
  updateStaffPermissions,
  removeStaffAssignment,
  importStaffList,
} from '../data/mutations';
import type {
  AddStaffUserInput,
  ChangeStaffRoleInput,
  UpdateStaffPermissionsInput,
  ImportStaffListInput,
} from '../schemas';

/** Mutation hooks for the "All Users" directory. Every action revalidates server-side; router.refresh() pulls the re-rendered directory back into this view. */

export function useAddStaffUser(options?: { onSuccess?: () => void }) {
  const router = useRouter();

  return useMutation({
    mutationFn: async (input: AddStaffUserInput) => unwrap(await addStaffUser(input)),
    onSuccess: ({ email }) => {
      toast.success(`${email} added.`);
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not add this user'));
    },
  });
}

export function useChangeStaffRole() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (input: ChangeStaffRoleInput) => unwrap(await changeStaffRole(input)),
    onSuccess: () => {
      toast.success('Role updated');
      router.refresh();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not change the role'));
    },
  });
}

export function useUpdateStaffPermissions(options?: { onSuccess?: () => void }) {
  const router = useRouter();

  return useMutation({
    mutationFn: async (input: UpdateStaffPermissionsInput) =>
      unwrap(await updateStaffPermissions(input)),
    onSuccess: () => {
      toast.success('Permissions saved');
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not save permissions'));
    },
  });
}

export function useRemoveStaffAssignment(options?: { onSuccess?: () => void }) {
  const router = useRouter();

  return useMutation({
    mutationFn: async (staffId: string) => unwrap(await removeStaffAssignment({ staffId })),
    onSuccess: () => {
      toast.success('Removed');
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not remove this person'));
    },
  });
}

export function useImportStaffList(options?: {
  onSuccess?: (result: { added: number; skipped: number; failed: number }) => void;
}) {
  const router = useRouter();

  return useMutation({
    mutationFn: async (input: ImportStaffListInput) => unwrap(await importStaffList(input)),
    onSuccess: (result) => {
      const parts = [`${String(result.added)} added`];
      if (result.skipped > 0) parts.push(`${String(result.skipped)} already on this show`);
      if (result.failed > 0) parts.push(`${String(result.failed)} failed`);
      toast.success(parts.join(' · '));
      router.refresh();
      options?.onSuccess?.(result);
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not import that file'));
    },
  });
}
