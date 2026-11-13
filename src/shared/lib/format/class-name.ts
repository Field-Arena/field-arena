/* A class's stored label is built as "Group — Test — Division" (e.g.
 * "Grand Prix — Grand Prix (2026) — Adult Amateur (AA)"). Shown as-is next to
 * its division it read "… — Adult Amateur (AA) (Adult Amateur (AA))". This
 * gives the rider-facing name: the test alone, without the group prefix that
 * repeats it ("First Level — First Level Test 1" → "First Level Test 1") and
 * without the division, which callers show separately. */
const SEPARATOR = ' — ';

export function riderClassName(cls: {
  label: string;
  displayName?: string | null;
  division?: string | null;
}): string {
  // A blank display name falls back to the label, so `??` alone won't do.
  const display = cls.displayName?.trim() ?? '';
  const base = display.length > 0 ? display : cls.label;
  const division = cls.division?.trim();

  let parts = base
    .split(SEPARATOR)
    .map((p) => p.trim())
    .filter(Boolean);
  if (division && parts.length > 1 && parts[parts.length - 1] === division) {
    parts = parts.slice(0, -1);
  }
  if (parts.length === 2) {
    const [group, test] = parts as [string, string];
    if (test.toLowerCase().startsWith(group.toLowerCase())) parts = [test];
  }
  return parts.join(SEPARATOR) || base;
}
