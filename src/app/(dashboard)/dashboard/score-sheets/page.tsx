import type { Metadata } from 'next';
import Link from 'next/link';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { getScoreSheets } from '@/modules/shows/data/score-sheet-queries';
import { ScoreSheetPages } from '@/modules/shows/ui/score-sheets/score-sheet-pages';
import { PrintNowButton } from '@/modules/shows/ui/score-sheets/print-now-button';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'Score sheets — Field & Arena' };

/* Blank score sheets with the rider sticker, opened from the Master Schedule:
 * ?class=<id> for one test, ?day=<n> for one day, neither for the whole show. */
export default async function ScoreSheetsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string; class?: string; day?: string }>;
}) {
  const { show: requestedShowId, class: classId, day } = await searchParams;
  const context = await getOrganizerContext(requestedShowId);
  if (!context.currentShow) {
    return <EmptyPanel title="No show selected" note="Open score sheets from a show's schedule." />;
  }

  const dayIndex = day !== undefined && /^\d+$/.test(day) ? Number(day) : null;
  const pack = await getScoreSheets(context.currentShow.id, {
    classId: classId ?? null,
    day: dayIndex,
  });
  const showRef = context.currentShow.slug ?? context.currentShow.id;

  if (!pack || pack.sheets.length === 0) {
    return (
      <EmptyPanel
        title="No score sheets to print"
        note="There are no active (unscratched) rides for this selection yet."
      />
    );
  }

  const missingTests = pack.sheets.filter((s) => !s.test).length;

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <Link
            href={`/dashboard/schedule?show=${showRef}`}
            prefetch={false}
            className="text-[13px] font-semibold text-[#1A5B3C]"
          >
            ← Back to schedule
          </Link>
          <h1 className="mt-1 mb-0 text-[28px] font-bold text-[#0D2C23]">Score sheets</h1>
          <p className="mt-1 mb-0 text-[14px] text-[#5A6B63]">
            {pack.showName} · {pack.scopeLabel} · {pack.sheets.length} sheet
            {pack.sheets.length === 1 ? '' : 's'}, in ride order
          </p>
          {missingTests > 0 && (
            <p className="mt-1.5 mb-0 text-[13.5px] font-semibold text-[#9A6B00]">
              {missingTests} sheet{missingTests === 1 ? ' has' : 's have'} no test assigned yet —
              they print with the sticker only.
            </p>
          )}
        </div>
        <PrintNowButton autoPrint />
      </div>
      <ScoreSheetPages pack={pack} />
    </section>
  );
}
