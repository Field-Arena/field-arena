import 'server-only';
import { UserFacingError } from '@/shared/lib/action-result';

// An update RLS silently filters out returns no error and no rows — without
// this the action would report success for a write that never happened.
// Use with `.select('id')` on the update.
export function assertUpdated(rows: unknown[] | null, message: string): void {
  if (!rows || rows.length === 0) throw new UserFacingError(message);
}
