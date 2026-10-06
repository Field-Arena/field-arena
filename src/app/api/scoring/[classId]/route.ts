import { NextResponse } from 'next/server';
import { canViewScoringClass, getScoringState } from '@/modules/scoring/data/queries';
import { isUuid } from '@/shared/lib/utils';

export async function GET(_request: Request, context: { params: Promise<{ classId: string }> }) {
  const { classId } = await context.params;
  if (!isUuid(classId)) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  try {
    const access = await canViewScoringClass(classId);
    if (access === 'unauthenticated') {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    }
    if (access === 'forbidden') {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
    }

    const state = await getScoringState(classId);
    return NextResponse.json(state);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load scoring state';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
