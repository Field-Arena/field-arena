'use client';

import { markOrderChecked } from '@/modules/scoring/data/mutations';
import { useRefreshingMutation } from '@/shared/hooks/use-refreshing-mutation';

export function useMarkOrderChecked() {
  return useRefreshingMutation((classId: string) => markOrderChecked({ classId }), {
    successMessage: 'Ride order marked checked',
    errorFallback: 'Could not mark the ride order checked',
  });
}
