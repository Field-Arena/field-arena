'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { addSuperAdmin, removeSuperAdmin } from '@/modules/superadmin/data/mutations';
import type { AddSuperAdminInput } from '@/modules/superadmin/schemas';
import { readableError } from '@/shared/lib/error-message';

/**
 * Mutation hooks for the Users page's Super Admins tab.
 *
 * Toasts and refreshes live here, not in the UI, per layers.md. Both actions
 * change who can reach the console, so each ends with router.refresh() on top of
 * the server-side revalidatePath, so the current view reflects the change
 * immediately.
 */

function errorMessage(error: unknown, fallback: string): string {
  return readableError(error, fallback);
}

export function useAddSuperAdmin(options?: { onSuccess?: () => void }) {
  const router = useRouter();

  return useMutation({
    // Typed result, not a throw (BUG-API-001/USERS-001) — re-throw on failure so
    // the real reason (e.g. email rate limit, address already registered)
    // reaches this onError toast instead of an opaque 500.
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
