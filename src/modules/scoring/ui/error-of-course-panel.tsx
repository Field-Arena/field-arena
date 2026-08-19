import { errorDeduction } from '@/modules/scoring/scoring-engine';
import type { TestDefinition } from '@/modules/scoring/types';

export function ErrorOfCoursePanel({
  errors,
  errorAt,
  test,
}: {
  errors: number;
  errorAt: Record<string, boolean>;
  test: TestDefinition;
}) {
  const deduction = errorDeduction(errors, test);
  const label =
    deduction === 'ELIM'
      ? 'Eliminated'
      : deduction.amount === 0
        ? 'No deduction yet'
        : deduction.mode === 'pct'
          ? `−${String(deduction.amount)}%`
          : `−${String(deduction.amount)} pts`;

  const movements = Object.keys(errorAt)
    .filter((k) => errorAt[k])
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[#E9EDEB] bg-white p-[14px_18px]">
      <span className="text-[10px] font-bold tracking-[.12em] text-[#7A8781] uppercase">
        Errors of course
      </span>
      <span className="text-ink-deep text-[15px] font-bold">{errors}</span>
      {movements.length > 0 && (
        <span className="text-[12.5px] text-[#7A8781]">
          at movement{movements.length > 1 ? 's' : ''} {movements.join(', ')}
        </span>
      )}
      <span
        className={`text-[13px] font-semibold ${deduction === 'ELIM' ? 'text-[#B23A3A]' : 'text-[#5A6B63]'}`}
      >
        {label}
      </span>
    </div>
  );
}
