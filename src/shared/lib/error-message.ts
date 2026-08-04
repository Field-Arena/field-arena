/**
 * A message fit to show a person, from whatever a Server Action threw.
 *
 * Zod's own `ZodError.message` is the JSON dump of every issue, and a Server
 * Action serialises a thrown error by its message alone — so a schema rejection
 * arrives at the client as a wall of `{"origin":"string","code":"invalid_format"
 * ,"pattern":"/^\\d{4}-\\d{2}-\\d{2}$/"...}`. That is what an organizer saw in a
 * toast when a field they had not filled in yet failed validation.
 *
 * The issue objects carry a written `message` each; the first one is the useful
 * sentence. Anything that is not that JSON shape passes through untouched.
 */
/**
 * Next.js strips the message off any error a Server Action or Server Component
 * throws in a production build, replacing it with this boilerplate and a
 * `digest` for the server log. That is deliberate — a raw message could carry a
 * connection string — but it means the text arriving here is about React, not
 * about what the person just tried to do.
 *
 * Matched on the two stable phrases rather than the whole paragraph, which has
 * been reworded between Next.js releases.
 */
function isRedactedServerError(text: string): boolean {
  return (
    text.includes('omitted in production builds') ||
    (text.includes('digest property') && text.includes('server'))
  );
}

export function readableError(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;

  const text = error.message.trim();
  if (!text) return fallback;

  // The caller's fallback names the actual operation ("Could not invite this
  // person"), which is far more use than a paragraph about Server Components.
  if (isRedactedServerError(text)) return fallback;

  if (!text.startsWith('[')) return text;

  try {
    const issues: unknown = JSON.parse(text);
    if (!Array.isArray(issues)) return text;

    const messages = issues
      .map((issue) =>
        typeof issue === 'object' && issue !== null && 'message' in issue
          ? (issue as { message?: unknown }).message
          : null
      )
      .filter((m): m is string => typeof m === 'string' && m.length > 0);

    return messages[0] ?? fallback;
  } catch {
    // Not JSON after all — a real message that happens to start with a bracket.
    return text;
  }
}
