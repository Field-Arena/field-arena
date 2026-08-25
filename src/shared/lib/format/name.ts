export function initials(name: string | null | undefined): string {
  return (name ?? '')
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
}

export function fullName(
  first: string | null | undefined,
  last: string | null | undefined,
): string {
  return [first, last].filter(Boolean).join(' ').trim();
}

export function lastFirst(
  first: string | null | undefined,
  last: string | null | undefined,
): string {
  if (!last) return first ?? '';
  if (!first) return last;
  return `${last}, ${first}`;
}
