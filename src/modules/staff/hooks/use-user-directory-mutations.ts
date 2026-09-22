'use client';

import { unwrap } from '@/shared/lib/unwrap-action';
import { useRefreshingMutation } from '@/shared/hooks/use-refreshing-mutation';
import {
  addStaffUser,
  changeStaffRole,
  updateStaffPermissions,
  removeStaffAssignment,
  importStaffList,
  reassignStaffShow,
  updateStaffDetails,
  assignRingAnnouncer,
  updateRiderContactInfo,
  verifyRiderHorseDocument,
} from '../data/mutations';
import type {
  AddStaffUserInput,
  ChangeStaffRoleInput,
  UpdateStaffPermissionsInput,
  ImportStaffListInput,
  ReassignStaffShowInput,
  UpdateStaffDetailsInput,
  AssignRingAnnouncerInput,
  UpdateRiderContactInfoInput,
} from '../schemas';
import type { VerifyHorseDocumentInput } from '@/modules/shows/schemas';

export function useAddStaffUser(options?: { onSuccess?: () => void }) {
  return useRefreshingMutation(
    async (input: AddStaffUserInput) => unwrap(await addStaffUser(input)),
    {
      successMessage: ({ email }) => `${email} added.`,
      errorFallback: 'Could not add this user',
      onSuccess: () => {
        options?.onSuccess?.();
      },
    },
  );
}

export function useChangeStaffRole() {
  return useRefreshingMutation(
    async (input: ChangeStaffRoleInput) => unwrap(await changeStaffRole(input)),
    {
      successMessage: 'Role updated',
      errorFallback: 'Could not change the role',
    },
  );
}

export function useUpdateStaffPermissions(options?: { onSuccess?: () => void }) {
  return useRefreshingMutation(
    async (input: UpdateStaffPermissionsInput) => unwrap(await updateStaffPermissions(input)),
    {
      successMessage: 'Permissions saved',
      errorFallback: 'Could not save permissions',
      onSuccess: () => {
        options?.onSuccess?.();
      },
    },
  );
}

export function useReassignStaffShow() {
  return useRefreshingMutation(
    async (input: ReassignStaffShowInput) => unwrap(await reassignStaffShow(input)),
    {
      successMessage: 'Moved to the new show',
      errorFallback: 'Could not move this person to that show',
    },
  );
}

export function useUpdateStaffDetails(options?: { onSuccess?: () => void }) {
  return useRefreshingMutation(
    async (input: UpdateStaffDetailsInput) => unwrap(await updateStaffDetails(input)),
    {
      successMessage: 'Details saved',
      errorFallback: 'Could not save these details',
      onSuccess: () => {
        options?.onSuccess?.();
      },
    },
  );
}

export function useRemoveStaffAssignment(options?: { onSuccess?: () => void }) {
  return useRefreshingMutation(
    async (staffId: string) => unwrap(await removeStaffAssignment({ staffId })),
    {
      successMessage: 'Removed',
      errorFallback: 'Could not remove this person',
      onSuccess: () => {
        options?.onSuccess?.();
      },
    },
  );
}

export function useUpdateRiderContactInfo(options?: { onSuccess?: () => void }) {
  return useRefreshingMutation(
    async (input: UpdateRiderContactInfoInput) => unwrap(await updateRiderContactInfo(input)),
    {
      successMessage: 'Saved',
      errorFallback: "Could not save this rider's details",
      onSuccess: () => {
        options?.onSuccess?.();
      },
    },
  );
}

export function useVerifyRiderHorseDocument(options?: { onSuccess?: () => void }) {
  return useRefreshingMutation(
    async (input: VerifyHorseDocumentInput) => unwrap(await verifyRiderHorseDocument(input)),
    {
      successMessage: 'Saved',
      errorFallback: 'Could not save this document',
      onSuccess: () => {
        options?.onSuccess?.();
      },
    },
  );
}

export function useAssignRingAnnouncer() {
  return useRefreshingMutation(
    async (input: AssignRingAnnouncerInput) => unwrap(await assignRingAnnouncer(input)),
    { errorFallback: 'Could not save that ring assignment' },
  );
}

export function useImportStaffList(options?: {
  onSuccess?: (result: { added: number; skipped: number; failed: number }) => void;
}) {
  return useRefreshingMutation(
    async (input: ImportStaffListInput) => unwrap(await importStaffList(input)),
    {
      successMessage: (result) => {
        const parts = [`${String(result.added)} added`];
        if (result.skipped > 0) parts.push(`${String(result.skipped)} already on this show`);
        if (result.failed > 0) parts.push(`${String(result.failed)} failed`);
        return parts.join(' · ');
      },
      errorFallback: 'Could not import that file',
      onSuccess: (result) => {
        options?.onSuccess?.(result);
      },
    },
  );
}
