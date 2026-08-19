import type { DocumentRequirement } from '@/modules/riders/types';

/**
 * Parses `shows.document_requirements` (jsonb) into a safe, typed list.
 *
 * Ported from legacy's realDocReqsForShow (rider.html): a requirement the
 * organizer hasn't finished naming yet (blank label, still being typed in
 * Setup) isn't something to prompt a rider to upload against, so it's
 * filtered out here rather than rendering an unlabeled upload block.
 */
export function parseDocumentRequirements(raw: unknown): DocumentRequirement[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is DocumentRequirement =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as { id?: unknown }).id === 'string' &&
      typeof (item as { label?: unknown }).label === 'string' &&
      (item as { label: string }).label.trim().length > 0
  );
}
