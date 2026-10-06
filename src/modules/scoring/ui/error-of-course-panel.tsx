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
    <div className="flex flex-wrap items-center gap-4">
      <span className="text-[13px] font-semibold text-[var(--fa-ink)]">Errors of course</span>
      <span className="text-[15px] font-bold text-[#101828]">{errors}</span>
      {movements.length > 0 && (
        <span className="text-[12.5px] text-[#8A94A3]">
          at movement{movements.length > 1 ? 's' : ''} {movements.join(', ')}
        </span>
      )}
      <span
        className={`text-[13px] font-semibold ${deduction === 'ELIM' ? 'text-[#B23A3A]' : 'text-[#475467]'}`}
      >
        {label}
      </span>
    </div>
  );
}
