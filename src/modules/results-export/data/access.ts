import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';

export class ExportAccessError extends Error {
  constructor(
    message: string,
    readonly status: 401 | 403,
  ) {
    super(message);
    this.name = 'ExportAccessError';
  }
}

/* Results exports carry rider and owner contact details, so the server checks
 * the same canExportRoster grant the Results page uses — it is not left to a
 * hidden button. has_show_permission resolves SuperAdmins, the organization's
 * Organizer and owners as allowed, and everyone else from their per-show staff
 * assignment. The data itself is then read with the caller's own session, so
 * row-level security still applies underneath. */
export async function assertCanExportResults(showId: string): Promise<void> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new ExportAccessError('Sign in to export results.', 401);

  const { data: allowed, error } = await supabase.rpc('has_show_permission', {
    target_show_id: showId,
    permission_key: 'canExportRoster',
  });
  if (error) throw error;
  if (!allowed) {
    throw new ExportAccessError("You don't have permission to export results for this show.", 403);
  }
}
