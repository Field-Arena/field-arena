'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { addSuperAdmin, removeSuperAdmin } from '@/modules/superadmin/data/mutations';
import type { AddSuperAdminInput } from '@/modules/superadmin/schemas';
import { readableError } from '@/shared/lib/error-message';

function errorMessage(error: unknown, fallback: string): string {
  return readableError(error, fallback);
}

export function useAddSuperAdmin(options?: { onSuccess?: () => void }) {
  const router = useRouter();

  return useMutation({
    mutationFn: async (input: AddSuperAdminInput) => {
      const result = await addSuperAdmin(input);
      if (!result.ok) throw new Error(result.error);
      return result;
    },
    onSuccess: ({ email }) => {
      toast.success(`Invite sent to ${email}. They'll set a password and sign in.`);
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Could not add this Super Admin'));
    },
  });
}

export function useRemoveSuperAdmin(options?: { onSuccess?: () => void }) {
  const router = useRouter();

  return useMutation({
    mutationFn: (id: string) => removeSuperAdmin({ id }),
    onSuccess: () => {
      toast.success('Super Admin removed.');
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Could not remove this Super Admin'));
    },
  });
}
