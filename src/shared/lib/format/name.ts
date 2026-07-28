/**
 * Name helpers.
 *
 * `initials` is ported from FA.initials in the legacy public/assets/app.js.
 *
 * FA.esc is deliberately NOT ported. It existed because the legacy views built
 * markup with innerHTML and had to escape interpolated text by hand. React
 * escapes text children, so a port would be a footgun: it would double-escape
 * ("O'Brien" rendering as "O&#39;Brien") and, worse, suggest that hand-escaping
 * is how safety is achieved here. Where raw markup is genuinely needed, the
 * right answer is sanitising the HTML, not escaping the text.
 */

/** Up to three initials, matching the legacy avatar behaviour. */
export function initials(name: string | null | undefined): string {
  return (name ?? '')
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
}

/**
 * Joins the separate first/last columns riders and staff carry, tolerating
 * either being absent — a staff member invited by email alone has neither until
 * they accept.
 */
export function fullName(
  first: string | null | undefined,
  last: string | null | undefined
): string {
  return [first, last].filter(Boolean).join(' ').trim();
}

/** "Marsh, Elena" — for alphabetical staff and member lists. */
export function lastFirst(
  first: string | null | undefined,
  last: string | null | undefined
): string {
  if (!last) return first ?? '';
  if (!first) return last;
  return `${last}, ${first}`;
}
