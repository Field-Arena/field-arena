import { NextResponse } from 'next/server';
import { getScoringState } from '@/modules/scoring/data/queries';

/**
 * The live-scoring screen's poll target — re-runs the exact same read
 * `getScoringState` does for the initial Server Component render. This is
 * the case `layers.md` names API routes for ("live scoring / running-order
 * widgets"): a Server Action can't be polled from a plain `useEffect`
 * interval the way a GET endpoint can. RLS is still the access boundary —
 * this route does no extra authorization of its own.
 */
export async function GET(_request: Request, context: { params: Promise<{ classId: string }> }) {
  const { classId } = await context.params;

  try {
    const state = await getScoringState(classId);
    return NextResponse.json(state);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load scoring state';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
