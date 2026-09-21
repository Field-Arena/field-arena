'use client';

import { setClassPanel } from '@/modules/judging/data/mutations';
import type { SetClassPanelInput } from '@/modules/judging/schemas';
import { useRefreshingMutation } from '@/shared/hooks/use-refreshing-mutation';

// No successMessage here — panel-form.tsx already shows its own toast via
// the per-call onSuccess it passes to .mutate(). This hook previously never
// called router.refresh() at all, so the panel list only reflected a save
// once something unrelated happened to trigger a refresh.
export function useSetClassPanel() {
  return useRefreshingMutation((input: SetClassPanelInput) => setClassPanel(input), {
    errorFallback: 'Could not save the panel',
  });
}
