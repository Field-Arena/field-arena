/**
 * Typed Server-Action results.
 *
 * A Server Action that throws is masked to an opaque HTTP 500 + digest in
 * production, so its message never reaches the client (BUG-API-001). Actions
 * that can fail for expected, user-facing reasons (validation, a name/email
 * clash, an email-provider error) return one of these unions instead; only
 * genuinely unexpected faults still throw. Kept in a plain (non-'use server')
 * module so it can export types and a helper — a 'use server' file may only
 * export async functions.
 */
export interface ActionFailure {
  ok: false;
  error: string;
}

export function fail(error: string): ActionFailure {
  return { ok: false, error };
}

export type CreateOrganizationResult = { ok: true; id: string; name: string } | ActionFailure;
export type AddSuperAdminResult = { ok: true; email: string } | ActionFailure;
