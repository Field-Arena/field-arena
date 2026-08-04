/**
 * How a Server Action reports a failure the person who triggered it should read.
 *
 * Next.js strips the message off any error a Server Action *throws* in a
 * production build — the client gets boilerplate about Server Components and a
 * digest for the server log. That is the right default, since a raw message can
 * carry a connection string, but it means a thrown "That email is already on
 * this show" never reaches the person who needs it.
 *
 * A *returned* value is not redacted. So the rule is: throw for a bug, return
 * for anything the person can act on.
 *
 * The client side is unchanged by this. `unwrap()` turns a returned failure
 * back into a thrown Error in the browser, where nothing redacts it, so every
 * existing `onError` handler and `readableError()` call keeps working.
 */
export type ActionResult<T> = { ok: true; data: T } | { ok: false; message: string };

/**
 * A failure the caller is meant to read and act on.
 *
 * Thrown inside an action body and converted to a returned message by `run()`.
 * Distinct from a plain Error, which is treated as a bug: its text is never
 * shown, only logged.
 */
export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserFacingError';
  }
}

/** Postgres error codes worth translating, keyed by constraint where it matters. */
const CONSTRAINT_MESSAGES: Record<string, string> = {
  staff_assignments_show_email_key: 'That email is already on this show.',
  member_database_org_email_key: 'Someone with that email is already in your database.',
  organizations_email_key: 'An organization with that email already exists.',
};

interface PostgresError {
  code?: string;
  message?: string;
  details?: string;
  constraint?: string;
}

/**
 * Turns whatever went wrong into one sentence a person can act on.
 *
 * Anything not recognised falls back to the caller's own wording rather than
 * leaking a driver message — an organizer cannot do anything with
 * `duplicate key value violates unique constraint "…_key"`, and it names a
 * table they have never heard of.
 */
export function describeError(error: unknown, fallback: string): string {
  if (error instanceof UserFacingError) return error.message;

  const pg = error as PostgresError | null;
  if (pg && typeof pg === 'object') {
    // 23505 unique_violation. The constraint name is the only reliable way to
    // know *which* uniqueness rule fired — the message text is not stable.
    if (pg.code === '23505') {
      const named = pg.constraint ?? '';
      const byName = CONSTRAINT_MESSAGES[named];
      if (byName) return byName;

      // Supabase's PostgREST responses carry the constraint inside `details`
      // rather than as its own field.
      const detail = `${pg.details ?? ''} ${pg.message ?? ''}`;
      for (const [constraint, message] of Object.entries(CONSTRAINT_MESSAGES)) {
        if (detail.includes(constraint)) return message;
      }
      return 'That already exists — check for a duplicate.';
    }

    if (pg.code === '23503')
      return 'Something this depends on no longer exists — reload and retry.';
    if (pg.code === '23514') return "That value isn't allowed here.";
    // RLS refused the write. The caller genuinely lacks the grant.
    if (pg.code === '42501') return "You don't have permission to do that.";
  }

  return fallback;
}

/**
 * Runs an action body and returns its failure instead of throwing it.
 *
 * `fallback` is what the person sees when the cause is not something we can
 * usefully explain — so write it as the operation that failed ("Could not
 * invite this person"), not as "an error occurred".
 */
export async function run<T>(fallback: string, body: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await body() };
  } catch (error) {
    // Logged in full server-side; only the translated sentence crosses to the
    // browser. This is the line to look at when a fallback shows up in a toast.
    console.error('[action]', fallback, error);
    return { ok: false, message: describeError(error, fallback) };
  }
}
