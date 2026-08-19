import { NextResponse } from 'next/server';
import { getScoringState } from '@/modules/scoring/data/queries';

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
