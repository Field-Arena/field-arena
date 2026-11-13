import { usefIdSchema } from '@/modules/judges/schemas';

export type UsefIdSaveDecision =
  | { action: 'invalid'; message: string }
  | { action: 'unchanged' }
  | { action: 'save'; value: string };

/**
 * What the scoresheet's USEF ID box should do with what the judge has typed:
 * never save something that is not numbers, never re-save what is already
 * saved, and let a blank through so the judge can clear it.
 */
export function decideUsefIdSave(typed: string, saved: string | null): UsefIdSaveDecision {
  const parsed = usefIdSchema.safeParse(typed);
  if (!parsed.success) {
    return { action: 'invalid', message: parsed.error.issues[0]?.message ?? 'Numbers only' };
  }
  if (parsed.data === (saved ?? '')) return { action: 'unchanged' };
  return { action: 'save', value: parsed.data };
}
