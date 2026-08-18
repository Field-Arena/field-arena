import type { ChecklistItem } from '@/modules/superadmin/schemas';

/** Narrows the lead's `onboarding_checklist` jsonb down to well-formed checklist items. */
export function toChecklist(raw: unknown): ChecklistItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (x): x is ChecklistItem =>
      typeof x === 'object' &&
      x !== null &&
      typeof (x as ChecklistItem).id === 'string' &&
      typeof (x as ChecklistItem).label === 'string'
  );
}
