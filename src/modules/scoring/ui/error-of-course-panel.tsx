import { errorDeduction } from '../scoring-engine';
import type { TestDefinition } from '../types';

/** The running error-of-course count and its deduction under the applicable schedule. */
export function ErrorOfCoursePanel({ errors, test }: { errors: number; test: TestDefinition }) {
  const deduction = errorDeduction(errors, test);
  const label =
    deduction === 'ELIM'
      ? 'Eliminated'
      : deduction.amount === 0
        ? 'No deduction yet'
        : deduction.mode === 'pct'
          ? `−${String(deduction.amount)}%`
          : `−${String(deduction.amount)} pts`;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-[#E9EDEB] bg-white p-[14px_18px]">
      <span className="text-[10px] font-bold tracking-[.12em] text-[#7A8781] uppercase">
        Errors of course
      </span>
      <span className="text-[15px] font-bold text-ink-deep">{errors}</span>
      <span
        className={`text-[13px] font-semibold ${deduction === 'ELIM' ? 'text-[#B23A3A]' : 'text-[#5A6B63]'}`}
      >
        {label}
      </span>
    </div>
  );
}
