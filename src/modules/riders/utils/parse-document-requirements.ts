import type { DocumentRequirement } from '@/modules/riders/types';

export function parseDocumentRequirements(raw: unknown): DocumentRequirement[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is DocumentRequirement =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as { id?: unknown }).id === 'string' &&
      typeof (item as { label?: unknown }).label === 'string' &&
      (item as { label: string }).label.trim().length > 0,
  );
}
