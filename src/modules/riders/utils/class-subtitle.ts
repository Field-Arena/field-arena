export function classSubtitle(cls: {
  label: string;
  displayName: string | null;
  testOptions: unknown;
}): string | null {
  if (Array.isArray(cls.testOptions) && cls.testOptions.length > 0) {
    const labels = cls.testOptions
      .filter(
        (o): o is { label: string } =>
          typeof o === 'object' &&
          o !== null &&
          typeof (o as { label?: unknown }).label === 'string',
      )
      .map((o) => o.label);
    if (labels.length > 0) return `Test of Choice — ride any one: ${labels.join(', ')}`;
  }
  const displayName = cls.displayName?.trim();
  if (displayName && displayName !== cls.label) return cls.label;
  return null;
}
