export type ActionResult<T> = { ok: true; data: T } | { ok: false; message: string };

export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserFacingError';
  }
}

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

export function describeError(error: unknown, fallback: string): string {
  if (error instanceof UserFacingError) return error.message;

  const pg = error as PostgresError | null;
  if (pg && typeof pg === 'object') {
    if (pg.code === '23505') {
      const named = pg.constraint ?? '';
      const byName = CONSTRAINT_MESSAGES[named];
      if (byName) return byName;

      const detail = `${pg.details ?? ''} ${pg.message ?? ''}`;
      for (const [constraint, message] of Object.entries(CONSTRAINT_MESSAGES)) {
        if (detail.includes(constraint)) return message;
      }
      return 'That already exists — check for a duplicate.';
    }

    if (pg.code === '23503')
      return 'Something this depends on no longer exists — reload and retry.';
    if (pg.code === '23514') return "That value isn't allowed here.";

    if (pg.code === '42501') return "You don't have permission to do that.";
  }

  return fallback;
}

export async function run<T>(fallback: string, body: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await body() };
  } catch (error) {
    console.error('[action]', fallback, error);
    return { ok: false, message: describeError(error, fallback) };
  }
}
