// Single source of truth for the Auto Assign / Stabling Groups grouping key.
// Trainer, falling back to stable, per the confirmed product decision — a
// trainer more reliably represents "who stables horses together" than the
// free-text stable/barn name, which is only used when trainer is blank.
export function normalizeTrainerKey(trainer: string | null, stable?: string | null): string | null {
  const t = trainer?.trim().toLowerCase().replace(/\s+/g, ' ');
  if (t) return t;
  const s = stable?.trim().toLowerCase().replace(/\s+/g, ' ');
  if (s) return s;
  return null;
}
