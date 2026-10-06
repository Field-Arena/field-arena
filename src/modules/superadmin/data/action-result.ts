import type { ActionFailure } from '@/modules/superadmin/types';

export function fail(error: string): ActionFailure {
  return { ok: false, error };
}
