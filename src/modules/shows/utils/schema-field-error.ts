import type { z } from 'zod';

/**
 * Runs `schema` over `input` and returns the first error message reported for
 * `field` (matched on the issue's top-level path), or `undefined` when that
 * field is valid. Lets the auto-saving Show Manager cards show the same rule
 * the server action enforces inline, before they fire the mutation.
 */
export function schemaFieldError(
  schema: z.ZodType,
  input: unknown,
  field: string,
): string | undefined {
  const result = schema.safeParse(input);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

/** Every field-level error message for `input`, keyed by top-level field. */
export function schemaFieldErrors(schema: z.ZodType, input: unknown): Record<string, string> {
  const result = schema.safeParse(input);
  if (result.success) return {};
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !(key in errors)) errors[key] = issue.message;
  }
  return errors;
}
