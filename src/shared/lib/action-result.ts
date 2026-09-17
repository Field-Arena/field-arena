import { ZodError } from 'zod';

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
  show_entries_number_unique_idx: 'That entry number is already assigned to another entry.',
  show_horses_bridle_unique_idx: 'That bridle number is already assigned to another horse.',
  show_entries_back_number_unique_idx: 'That back number is already assigned to another entry.',
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

/**
 * Parses input against a Zod schema and turns any validation failure into a
 * single, human-readable Error instead of letting the raw ZodError — a JSON
 * blob listing every failed field — reach the client as an uncaught
 * exception (the failure mode every 'use server' mutation hits by default
 * when it calls `schema.parse(input)` directly: Next.js turns that into a
 * bare 500 with no useful message). Use this at the top of a mutation in
 * place of `schema.parse(input)`.
 */
export function parseInput<T>(schema: { parse: (input: unknown) => T }, input: unknown): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      // UserFacingError, not a plain Error, so this message survives
      // describeError()/run() too — describeError only ever passes a plain
      // Error's message through by accident (its fallback branch), so a
      // mutation wrapped in run() would otherwise show its generic fallback
      // instead of the actual validation problem.
      throw new UserFacingError(error.issues[0]?.message ?? "That change isn't valid.");
    }
    throw error;
  }
}

export async function run<T>(fallback: string, body: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await body() };
  } catch (error) {
    console.error('[action]', fallback, error);
    return { ok: false, message: describeError(error, fallback) };
  }
}
