import { Card, Eyebrow } from '@/shared/ui/organizer/card';
import type { ShowCompleteness } from '../../data/setup-queries';

/**
 * "Setup readiness" — ported from the Admin Console design export's
 * ReadinessMeter.tsx, backed by getShowCompleteness's real per-section
 * checks instead of the export's own fake SETUP_SECTIONS/done flags.
 */
export function ReadinessMeter({ completeness }: { completeness: ShowCompleteness }) {
  const totalCount = completeness.sections.length;
  const doneCount = completeness.sections.filter((s) => s.ok).length;
  const percent = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);
  const bar = percent === 100 ? '#1A5B3C' : percent >= 50 ? '#C9A227' : '#B4432F';

  return (
    <Card className="mb-4 px-5 py-[18px]">
      <div className="mb-3 flex flex-wrap items-baseline gap-3">
        <Eyebrow>Setup readiness</Eyebrow>
        <span className="text-[26px] leading-none font-bold tracking-[-.028em] text-[#16261F]">
          {percent}%
        </span>
        <span className="text-[12.5px] text-[#98A29D]">
          {doneCount} of {totalCount} sections complete
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-[#EEF2F0]"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-[width] duration-300 ease-out"
          style={{ width: `${String(percent)}%`, background: bar }}
        />
      </div>
      {percent < 100 && (
        <>
          <p className="mt-3 text-[12.5px] text-[#6E7C76]">
            Still open:{' '}
            {completeness.sections
              .filter((s) => !s.ok)
              .map((s) => s.name)
              .join(', ')}
          </p>
          <p className="text-forest mt-1 text-[12.5px] font-semibold">
            Next: finish {completeness.sections.find((s) => !s.ok)?.name}.
          </p>
        </>
      )}
    </Card>
  );
}
