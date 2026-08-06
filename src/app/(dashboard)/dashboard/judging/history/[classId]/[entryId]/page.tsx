import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEntryScorecard } from '@/modules/judging/data/queries';
import { Card, ScreenLede, ScreenTitle } from '@/shared/ui/organizer/card';

export const metadata: Metadata = { title: 'Scorecard — Field & Arena' };

/**
 * History drill-down, level 3: one rider's full per-movement scorecard,
 * marks averaged across every seat that scored them. Ported from
 * judge-scribe.html's `historyView()` rider-detail state.
 */
export default async function HistoryScorecardPage({
  params,
}: {
  params: Promise<{ classId: string; entryId: string }>;
}) {
  const { classId, entryId } = await params;
  const card = await getEntryScorecard(entryId);
  if (!card) notFound();

  return (
    <>
      <div className="mb-[22px]">
        <Link
          href={`/dashboard/judging/history/${classId}`}
          className="mb-2 inline-block text-[13px] font-semibold text-[#5A6B63] hover:text-gold"
        >
          ← Back to placings
        </Link>
        <ScreenTitle>
          #{card.num} {card.rider}
        </ScreenTitle>
        <ScreenLede className="mb-0">
          {card.horse} · {card.className} · Final score: {card.finalPct ?? '—'}
        </ScreenLede>
      </div>

      {!card.test ? (
        <Card className="p-[24px_20px] text-[13.5px] text-[#7A8781]">No test definition on file for this ride.</Card>
      ) : (
        <div className="flex flex-col gap-4">
          <Card className="overflow-x-auto p-[16px_18px]">
            <table className="w-full min-w-[480px] border-collapse text-[13.5px]">
              <thead>
                <tr className="text-left text-[11px] tracking-[.08em] text-[#7A8781] uppercase">
                  <th className="p-2">#</th>
                  <th className="p-2">Movement</th>
                  <th className="p-2">Coef</th>
                  <th className="p-2 text-right">Mark</th>
                  <th className="p-2">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {card.test.movements.map((m) => (
                  <tr key={m.num} className="border-t border-[#E9EDEB]">
                    <td className="p-2">{m.num}</td>
                    <td className="p-2">{m.text}</td>
                    <td className="p-2">{m.coef}</td>
                    <td className="p-2 text-right font-mono font-semibold text-ink-deep">
                      {card.movementMarks[String(m.num)] ?? '—'}
                    </td>
                    <td className="p-2 text-[#5A6B63]">{card.movementRemarks[String(m.num)] ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {card.test.collectives.length > 0 && (
            <Card className="overflow-x-auto p-[16px_18px]">
              <table className="w-full min-w-[320px] border-collapse text-[13.5px]">
                <thead>
                  <tr className="text-left text-[11px] tracking-[.08em] text-[#7A8781] uppercase">
                    <th className="p-2">Category</th>
                    <th className="p-2">Coef</th>
                    <th className="p-2 text-right">Mark</th>
                  </tr>
                </thead>
                <tbody>
                  {card.test.collectives.map((c) => (
                    <tr key={c.key} className="border-t border-[#E9EDEB]">
                      <td className="p-2">{c.label}</td>
                      <td className="p-2">{c.coef}</td>
                      <td className="p-2 text-right font-mono font-semibold text-ink-deep">
                        {card.collectiveMarks[c.key] ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
