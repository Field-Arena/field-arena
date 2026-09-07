'use client';

import { useMemo, useState } from 'react';
import { ArrowLeftIcon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { cn } from '@/shared/lib/utils';
import type { SheetDefShape } from '@/modules/superadmin/utils/read-sheet-def';
import {
  computeSheetScore,
  maxPointsForDef,
  ELIGIBILITY_THRESHOLD,
} from '@/modules/superadmin/utils/compute-sheet-score';

const NR = 'font-[family-name:var(--font-nr)]';
const MARK =
  'w-[74px] rounded-[7px] border border-[#D7CFBB] bg-white px-2 py-1.5 text-center text-[14px] font-bold text-[#16261F] focus-visible:border-gold focus-visible:outline-none';

/* The faithful, fillable web version of the official paper sheet — the same
 * form a judge sees for this test, driven entirely by the definition above it.
 * This is how a transcribed sheet gets verified BEFORE a show publishes
 * against it: type marks in, watch the subtotal, total, percentage and the
 * championship-eligibility flag move exactly as they will on the day.
 * Nothing here is saved; it is a preview. */
export function SheetJudgePreview({
  title,
  def,
  onBack,
}: {
  title: string;
  def: SheetDefShape;
  onBack: () => void;
}) {
  const [movementMarks, setMovementMarks] = useState<Record<number, string>>({});
  const [collectiveMarks, setCollectiveMarks] = useState<Record<number, string>>({});
  const [errors, setErrors] = useState('');

  // A sheet that never had maxPoints transcribed still previews correctly:
  // fall back to the attainable maximum implied by its own coefficients.
  const effectiveDef = useMemo(() => {
    const declared = parseFloat(def.maxPoints);
    if (Number.isFinite(declared) && declared > 0) return def;
    return { ...def, maxPoints: String(maxPointsForDef(def)) };
  }, [def]);

  const score = computeSheetScore(effectiveDef, movementMarks, collectiveMarks, errors);
  const maxPoints = parseFloat(effectiveDef.maxPoints) || 0;

  const rowTotal = (mark: string | undefined, coef: number) => {
    const v = parseFloat(mark ?? '');
    return Number.isNaN(v) ? '' : String(v * (coef || 1));
  };

  return (
    <div className="mx-auto max-w-[1000px] space-y-5">
      <Button
        type="button"
        variant="ghost"
        onClick={onBack}
        className="text-hunter-deep hover:text-gold h-auto items-center gap-2 p-0 text-[13px] font-bold hover:bg-transparent"
      >
        <ArrowLeftIcon className="size-[14px]" aria-hidden />
        Back to catalog entry
      </Button>

      <div className="overflow-hidden rounded-[14px] border border-[#E7E0D0] bg-white">
        <div className="border-b border-[#E7E0D0] bg-[#F6F0E2] px-[26px] py-5">
          <div className="mb-1 flex flex-wrap items-baseline gap-3">
            <h2 className={`${NR} text-[24px] font-semibold text-[#16261F]`}>{title}</h2>
            <span className="inline-flex h-6 items-center rounded-md border border-dashed border-[#C9B98A] px-2.5 text-[11.5px] font-semibold text-[#7A6A3C]">
              Web version of the official sheet
            </span>
          </div>
          {def.intro && (
            <p className="text-[13px] text-[#5A6B63]">
              <span className="font-bold tracking-[0.1em] uppercase">Introduce</span> — {def.intro}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-x-8 gap-y-1.5 text-[12.5px] text-[#16261F]">
            {def.arena && (
              <span>
                <b>ARENA:</b> {def.arena}
              </span>
            )}
            {def.rideTime && (
              <span>
                <b>AVG RIDE TIME:</b> {def.rideTime}
              </span>
            )}
            <span>
              <b>MAXIMUM PTS:</b> {maxPoints}
            </span>
          </div>
          {def.purpose && (
            <p className="mt-3 text-[12.5px] leading-[1.55] text-[#5A6B63]">
              <b>PURPOSE</b> — {def.purpose}
            </p>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-[13px]">
            <thead>
              <tr className="bg-[#FBF7EC] text-[10px] tracking-[0.14em] text-[#7A6A5C] uppercase">
                <th className="w-[44px] px-3 py-2.5 text-left font-bold">No.</th>
                <th className="px-3 py-2.5 text-left font-bold">Test</th>
                <th className="px-3 py-2.5 text-left font-bold">Directives</th>
                <th className="w-[60px] px-3 py-2.5 text-right font-bold">Coef</th>
                <th className="w-[100px] px-3 py-2.5 text-right font-bold">Mark</th>
                <th className="w-[72px] px-3 py-2.5 text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {def.movements.map((mv, i) => (
                <tr key={i} className="border-t border-[#EEF2EF] align-top">
                  <td className="px-3 py-2.5 font-bold text-[#16261F]">{mv.n}</td>
                  <td className="px-3 py-2.5 text-[#16261F]">
                    {mv.text || <span className="text-[#9AA6A0]">—</span>}
                    {(mv.actions?.length ?? 0) > 0 && (
                      <ul className="mt-1 space-y-0.5 text-[12px] text-[#5A6B63]">
                        {mv.actions?.map((action, j) => (
                          <li key={j}>{action}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-[12.5px] text-[#5A6B63]">
                    {mv.directives ?? ''}
                  </td>
                  <td className="px-3 py-2.5 text-right text-[#16261F]">{mv.coef}</td>
                  <td className="px-3 py-2.5 text-right">
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      step={0.5}
                      inputMode="decimal"
                      aria-label={`Mark for movement ${String(mv.n)}`}
                      value={movementMarks[i] ?? ''}
                      onChange={(e) => {
                        setMovementMarks((prev) => ({ ...prev, [i]: e.target.value }));
                      }}
                      className={`h-auto ${MARK}`}
                    />
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-[#16261F]">
                    {rowTotal(movementMarks[i], mv.coef)}
                  </td>
                </tr>
              ))}

              {def.collectives.length > 0 && (
                <tr className="border-t border-[#E7E0D0] bg-[#FBF7EC]">
                  <td
                    colSpan={6}
                    className="px-3 py-2 text-[10px] font-bold tracking-[0.14em] text-[#7A6A5C] uppercase"
                  >
                    Collective marks
                  </td>
                </tr>
              )}
              {def.collectives.map((cm, i) => (
                <tr key={`c${String(i)}`} className="border-t border-[#EEF2EF] align-top">
                  <td className="px-3 py-2.5" />
                  <td className="px-3 py-2.5 font-semibold text-[#16261F]">{cm.name || '—'}</td>
                  <td className="px-3 py-2.5 text-[12.5px] text-[#5A6B63]">{cm.note ?? ''}</td>
                  <td className="px-3 py-2.5 text-right text-[#16261F]">{cm.coef}</td>
                  <td className="px-3 py-2.5 text-right">
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      step={0.5}
                      inputMode="decimal"
                      aria-label={`Mark for collective ${cm.name || String(i + 1)}`}
                      value={collectiveMarks[i] ?? ''}
                      onChange={(e) => {
                        setCollectiveMarks((prev) => ({ ...prev, [i]: e.target.value }));
                      }}
                      className={`h-auto ${MARK}`}
                    />
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-[#16261F]">
                    {rowTotal(collectiveMarks[i], cm.coef)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-6 border-t border-[#E7E0D0] bg-[#F6F0E2] px-[26px] py-5">
          <div>
            <label
              htmlFor="ss-errors"
              className="mb-2 block text-[10.5px] font-bold tracking-[0.13em] text-[#7A6A5C] uppercase"
            >
              Errors
            </label>
            <Input
              id="ss-errors"
              type="number"
              min={0}
              step={0.5}
              inputMode="decimal"
              value={errors}
              onChange={(e) => {
                setErrors(e.target.value);
              }}
              className={`h-auto ${MARK}`}
            />
            {def.errorScheduleText && (
              <p className="mt-2 max-w-[260px] text-[12px] text-[#8A8275]">
                {def.errorScheduleText}
              </p>
            )}
          </div>

          <dl className="flex flex-wrap gap-x-9 gap-y-3 text-right">
            {[
              { label: 'Subtotal', value: String(score.subtotal) },
              { label: 'Total', value: String(score.total) },
              { label: 'Percentage', value: `${score.percent.toFixed(3)}%` },
            ].map((cell) => (
              <div key={cell.label}>
                <dt className="mb-1 text-[10px] font-bold tracking-[0.14em] text-[#7A6A5C] uppercase">
                  {cell.label}
                </dt>
                <dd className={`${NR} text-[26px] leading-none text-[#16261F]`}>{cell.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div
          className={cn(
            'px-[26px] py-3 text-[13px] font-bold',
            score.eligible ? 'bg-[#E6F1EA] text-[#2E7048]' : 'bg-[#FCF1EF] text-[#B4432F]',
          )}
        >
          {score.eligible
            ? `Championship-eligible (≥ ${String(ELIGIBILITY_THRESHOLD)}%)`
            : `Below ${String(ELIGIBILITY_THRESHOLD)}%`}
        </div>
      </div>

      {def.footNote && (
        <p className="text-[12.5px] leading-[1.55] text-[#8A8275]">{def.footNote}</p>
      )}
    </div>
  );
}
