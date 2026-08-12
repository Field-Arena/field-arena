import { earned, marksEnteredCount, maxPoints, scoreLabel, sheetPct } from '../scoring-engine';
import { toSheet } from '../utils';
import type { ScoreRow, TestDefinition } from '../types';

/**
 * The three live-tally cards, ported from legacy's `tally()` — this judge's
 * running %, points earned so far, and how many of the test's marks have a
 * value — shown above the scoresheet so a judge/scribe sees the number
 * moving as they go, not only once the whole sheet is submitted.
 */
export function ScoreTally({ score, test }: { score: ScoreRow | undefined; test: TestDefinition }) {
  const sheet = toSheet(
    score ?? {
      movements: {},
      collectives: {},
      errors: 0,
      finalRemarks: '',
      remarks: {},
      submitted: false,
    }
  );

  const pct = sheetPct(sheet, test);
  const points = earned(sheet, test);
  const max = maxPoints(test);
  const totalMarks = test.movements.length + test.collectives.length;
  const entered = marksEnteredCount(sheet, test);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-[#E9EDEB] bg-white p-[16px_18px] text-center">
        <div className="font-[Newsreader,serif] text-[26px] font-bold text-ink-deep">
          {scoreLabel(pct)}
        </div>
        <div className="text-[11px] font-bold tracking-[.08em] text-[#7A8781] uppercase">
          This judge&apos;s %
        </div>
      </div>
      <div className="rounded-xl border border-[#E9EDEB] bg-white p-[16px_18px] text-center">
        <div className="font-[Newsreader,serif] text-[22px] font-bold text-ink-deep">
          {points} / {max}
        </div>
        <div className="text-[11px] font-bold tracking-[.08em] text-[#7A8781] uppercase">
          Points earned
        </div>
      </div>
      <div className="rounded-xl border border-[#E9EDEB] bg-white p-[16px_18px] text-center">
        <div className="font-[Newsreader,serif] text-[22px] font-bold text-ink-deep">
          {entered} / {totalMarks}
        </div>
        <div className="text-[11px] font-bold tracking-[.08em] text-[#7A8781] uppercase">
          Marks entered
        </div>
      </div>
    </div>
  );
}
