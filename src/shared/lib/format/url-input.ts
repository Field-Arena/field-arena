/**
 * Website fields accept "example.com" as well as "https://example.com". This
 * adds `https://` when no scheme was typed so the value can be validated (and
 * stored) as a real URL. Blank stays blank.
 */
export function normalizeWebsiteUrl(value: string): string {
  const trimmed = value.trim();
  if (trimmed === '') return '';
  return /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** Native attributes for website inputs (URL keyboard, browser autofill, cap). */
export const URL_INPUT_PROPS = {
  type: 'text',
  inputMode: 'url',
  autoComplete: 'url',
  maxLength: 200,
} as const;
