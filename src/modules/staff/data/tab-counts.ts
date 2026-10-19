'use server';

import { z } from 'zod';
import { getShowTodos } from '@/modules/shows/data/dashboard-todos';
import { daysUntilShow } from '@/modules/shows/utils/current-shows';
import { todayIsoInZone } from '@/modules/staff/utils';

const tabShowsSchema = z
  .array(
    z.object({
      id: z.uuid(),
      slug: z.string().max(200).nullable(),
      startDate: z.string().max(10).nullable(),
    }),
  )
  .max(6);

/** Urgent to-do counts for the show tabs' red badges, keyed by show id.
 * Runs once after the tabs mount, so loading them never slows navigation.
 * Reads go through the signed-in user's own RLS-scoped client. */
export async function getUrgentTodoCounts(input: unknown): Promise<Record<string, number>> {
  const shows = tabShowsSchema.parse(input);
  const today = todayIsoInZone();
  const entries = await Promise.all(
    shows.map(async (show) => {
      try {
        const { todos } = await getShowTodos(show, daysUntilShow(show, today));
        return [show.id, todos.filter((t) => t.priority === 'urgent').length] as const;
      } catch {
        return [show.id, 0] as const;
      }
    }),
  );
  return Object.fromEntries(entries);
}
