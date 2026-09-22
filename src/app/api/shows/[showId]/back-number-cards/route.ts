import { NextResponse } from 'next/server';
import { createServerClient } from '@/shared/lib/supabase/server';
import { assertCanManageEntryLedger } from '@/modules/shows/data/entry-numbering';
import { generateBackNumberCardsPdf } from '@/modules/shows/data/back-number-cards';

interface BackNumberCardsRequestBody {
  showEntryIds?: unknown;
  cardWidthIn?: unknown;
  cardHeightIn?: unknown;
}

function parseNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
}

export async function POST(request: Request, context: { params: Promise<{ showId: string }> }) {
  const { showId } = await context.params;

  try {
    await assertCanManageEntryLedger(showId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "You don't have permission to do that.";
    return NextResponse.json({ error: message }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as BackNumberCardsRequestBody;
  const showEntryIds = Array.isArray(body.showEntryIds)
    ? body.showEntryIds.filter((id): id is string => typeof id === 'string')
    : [];
  if (showEntryIds.length === 0) {
    return NextResponse.json({ error: 'Select at least one rider.' }, { status: 400 });
  }

  const supabase = await createServerClient();
  const { data: entries, error } = await supabase
    .from('show_entries')
    .select('id, back_number')
    .eq('show_id', showId)
    .in('id', showEntryIds)
    .not('back_number', 'is', null);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (entries.length === 0) {
    return NextResponse.json(
      { error: 'None of the selected riders have an equitation back number yet.' },
      { status: 400 },
    );
  }

  const cards = entries.reduce<{ backNumber: string }[]>((acc, e) => {
    if (e.back_number) acc.push({ backNumber: e.back_number });
    return acc;
  }, []);

  const pdfBytes = await generateBackNumberCardsPdf(cards, {
    cardWidthIn: parseNumber(body.cardWidthIn),
    cardHeightIn: parseNumber(body.cardHeightIn),
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="back-numbers-${showId}.pdf"`,
    },
  });
}
