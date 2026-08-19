import type { ChecklistItem } from '@/modules/superadmin/schemas';

export function toChecklist(raw: unknown): ChecklistItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (x): x is ChecklistItem =>
      typeof x === 'object' &&
      x !== null &&
      typeof (x as ChecklistItem).id === 'string' &&
      typeof (x as ChecklistItem).label === 'string',
  );
}
