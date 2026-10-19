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
    <div className="flex flex-wrap gap-2.5">
      {cards.map((card) => (
        <div
          key={card.key}
          className={
            card.key === 'pct'
              ? 'min-w-[120px] rounded-[10px] bg-[var(--fa-brand)] px-4 py-2.5 text-center text-white'
              : 'min-w-[96px] rounded-[10px] border border-[var(--fa-line)] bg-white px-4 py-2.5 text-center'
          }
        >
          <div
            className={`font-[family-name:var(--fa-serif)] text-[22px] leading-tight font-semibold ${card.key === 'pct' ? 'text-white' : 'text-[var(--fa-ink)]'}`}
          >
            {card.value}
          </div>
          <div
            className={`text-[10px] font-bold tracking-[.08em] uppercase ${card.key === 'pct' ? 'text-white/80' : 'text-[var(--fa-ink-3)]'}`}
          >
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
}
