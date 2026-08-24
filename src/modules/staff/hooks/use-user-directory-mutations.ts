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
  reassignStaffShow,
  updateStaffDetails,
} from '../data/mutations';
import type {
  AddStaffUserInput,
  ChangeStaffRoleInput,
  UpdateStaffPermissionsInput,
  ImportStaffListInput,
  ReassignStaffShowInput,
  UpdateStaffDetailsInput,
} from '../schemas';

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

export function useReassignStaffShow() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (input: ReassignStaffShowInput) => unwrap(await reassignStaffShow(input)),
    onSuccess: () => {
      toast.success('Moved to the new show');
      router.refresh();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not move this person to that show'));
    },
  });
}

export function useUpdateStaffDetails(options?: { onSuccess?: () => void }) {
  const router = useRouter();

  return useMutation({
    mutationFn: async (input: UpdateStaffDetailsInput) => unwrap(await updateStaffDetails(input)),
    onSuccess: () => {
      toast.success('Details saved');
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not save these details'));
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
