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

  if (isRedactedServerError(text)) return fallback;

  if (!text.startsWith('[')) return text;

  try {
    const issues: unknown = JSON.parse(text);
    if (!Array.isArray(issues)) return text;

    const messages = issues
      .map((issue) =>
        typeof issue === 'object' && issue !== null && 'message' in issue
          ? (issue as { message?: unknown }).message
          : null,
      )
      .filter((m): m is string => typeof m === 'string' && m.length > 0);

    return messages[0] ?? fallback;
  } catch {
    return text;
  }
}
