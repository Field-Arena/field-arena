import { NextResponse } from 'next/server';
import { getRiderScorecard } from '@/modules/riders/data/queries';

/**
 * The Results/Schedule tabs' scorecard drill-in fetch target — same reason
 * `/api/scoring/[classId]` exists (layers.md's API-route exception): opened
 * client-side from a click on one of potentially many entries, so it needs a
 * plain GET a client component can call on demand, not a Server Action.
 * `getRiderScorecard` does its own identity + ownership check and returns
 * null for anything that isn't the caller's own entry — this route adds no
 * authorization of its own.
 */
export async function GET(_request: Request, context: { params: Promise<{ entryId: string }> }) {
  const { entryId } = await context.params;

  try {
    const scorecard = await getRiderScorecard(entryId);
    if (!scorecard) {
      return NextResponse.json({ error: 'Scorecard not found.' }, { status: 404 });
    }
    return NextResponse.json(scorecard);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load scorecard';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
