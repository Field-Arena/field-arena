'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import { applyToShowPublic } from '@/modules/vendors/data/mutations';
import type { ApplyToShowPublicInput } from '@/modules/vendors/schemas';

/**
 * Backs VendorApplyEntryForm (the public, no-account "I'm a Vendor" entry
 * point) — kept out of that UI file per this codebase's own layer rule
 * (ui/ must never import from data/, .claude/rules/layers.md). A single
 * mutation, not a sign-up-then-apply pair: legacy's vendor-apply.html was one
 * anonymous POST, and applyToShowPublic ported that faithfully, so there is
 * no separate account/verify step to sequence around anymore.
 */
export function useApplyToShowPublic() {
  return useMutation({
    mutationFn: (input: ApplyToShowPublicInput) => applyToShowPublic(input),
    onSuccess: () => {
      toast.success('Application submitted — the organizer will review it.');
    },
    onError: (error: unknown) => {
      toast.error(readableError(error, 'Could not submit your application'));
    },
  });
}
