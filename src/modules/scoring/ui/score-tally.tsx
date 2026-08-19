import {
  earned,
  marksEnteredCount,
  maxPoints,
  scoreLabel,
  sheetPct,
} from '@/modules/scoring/scoring-engine';
import { toSheet } from '@/modules/scoring/utils/to-sheet';
import type { ScoreRow, TestDefinition } from '@/modules/scoring/types';

export function ScoreTally({ score, test }: { score: ScoreRow | undefined; test: TestDefinition }) {
  const sheet = toSheet(
    score ?? {
      movements: {},
      collectives: {},
      errors: 0,
      finalRemarks: '',
      remarks: {},
      submitted: false,
    },
  );

  const pct = sheetPct(sheet, test);
  const points = earned(sheet, test);
  const max = maxPoints(test);
  const totalMarks = test.movements.length + test.collectives.length;
  const entered = marksEnteredCount(sheet, test);

  const cards = [
    { key: 'pct', size: 'text-[26px]', value: scoreLabel(pct), label: "This judge's %" },
    {
      key: 'points',
      size: 'text-[22px]',
      value: `${String(points)} / ${String(max)}`,
      label: 'Points earned',
    },
    {
      key: 'marks',
      size: 'text-[22px]',
      value: `${String(entered)} / ${String(totalMarks)}`,
      label: 'Marks entered',
    },
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.key}
          className="rounded-xl border border-[#E9EDEB] bg-white p-[16px_18px] text-center"
        >
          <div className={`font-[Newsreader,serif] ${card.size} text-ink-deep font-bold`}>
            {card.value}
          </div>
          <div className="text-[11px] font-bold tracking-[.08em] text-[#7A8781] uppercase">
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
}
