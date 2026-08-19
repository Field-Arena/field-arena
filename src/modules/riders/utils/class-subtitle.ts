/**
 * A class's subtitle line, wherever its name is shown — the italic note
 * under a class title in legacy's classSubtitleReal (rider.html). Two cases,
 * checked in this order:
 *  - `test_options` non-empty: always "Test of Choice — ride any one: A, B, …",
 *    regardless of whether the class was also renamed.
 *  - otherwise, a renamed class (`display_name` set and different from
 *    `label`) shows its original `label` as the subtitle, so a rider (or
 *    judge) can still see the real test name under the organizer's rename.
 * Returns null for an ordinary, unrenamed, single-test class — no subtitle
 * to render, matching legacy's `return ''`.
 */
export function classSubtitle(cls: {
  label: string;
  displayName: string | null;
  testOptions: unknown;
}): string | null {
  if (Array.isArray(cls.testOptions) && cls.testOptions.length > 0) {
    const labels = cls.testOptions
      .filter((o): o is { label: string } => typeof o === 'object' && o !== null && typeof (o as { label?: unknown }).label === 'string')
      .map((o) => o.label);
    if (labels.length > 0) return `Test of Choice — ride any one: ${labels.join(', ')}`;
  }
  const displayName = cls.displayName?.trim();
  if (displayName && displayName !== cls.label) return cls.label;
  return null;
}
