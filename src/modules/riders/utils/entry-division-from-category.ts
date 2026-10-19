import { riderCategoryToDivisionCode } from '@/modules/riders/utils/rider-category-to-division-code';
import type { EntryDivisionCode } from '@/modules/riders/types';

/** A starting division for the per-class picker, from the rider's legacy
 * profile category when one was saved before sign-up stopped asking for it.
 * Null when there is none, so the rider picks it themselves. */
export function entryDivisionFromCategory(category: string | null): EntryDivisionCode | null {
  if (!category?.trim()) return null;
  return riderCategoryToDivisionCode(category);
}
