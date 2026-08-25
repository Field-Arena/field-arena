import { NextResponse } from 'next/server';
import { getRiderScorecard } from '@/modules/riders/data/queries';

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
