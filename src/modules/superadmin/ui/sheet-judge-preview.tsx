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
  'w-[74px] rounded-[7px] border border-[#E7EAEE] bg-white px-2 py-1.5 text-center text-[14px] font-bold text-[#101828] focus-visible:border-[#9FD3BA] focus-visible:outline-none';

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
        className="h-auto items-center gap-2 p-0 text-[13px] font-bold text-[#101828] hover:bg-transparent hover:text-[#146A47]"
      >
        <ArrowLeftIcon className="size-[14px]" aria-hidden />
        Back to catalog entry
      </Button>

      <div className="overflow-hidden rounded-[14px] border border-[#E7EAEE] bg-white">
        <div className="border-b border-[#E7EAEE] bg-[#FBFCFD] px-[26px] py-5">
          <div className="mb-1 flex flex-wrap items-baseline gap-3">
            <h2 className={`${NR} text-[24px] font-semibold text-[#101828]`}>{title}</h2>
            <span className="inline-flex h-6 items-center rounded-md border border-dashed border-[#F6DCB8] px-2.5 text-[11.5px] font-semibold text-[#B45309]">
              Web version of the official sheet
            </span>
          </div>
          {def.intro && (
            <p className="text-[13px] text-[#475467]">
              <span className="font-bold tracking-[0.1em] uppercase">Introduce</span> — {def.intro}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-x-8 gap-y-1.5 text-[12.5px] text-[#101828]">
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
            <p className="mt-3 text-[12.5px] leading-[1.55] text-[#475467]">
              <b>PURPOSE</b> — {def.purpose}
            </p>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-[13px]">
            <thead>
              <tr className="bg-[#FBFCFD] text-[10px] tracking-[.08em] text-[#475467] uppercase">
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
                <tr key={i} className="border-t border-[#EEF1F4] align-top">
                  <td className="px-3 py-2.5 font-bold text-[#101828]">{mv.n}</td>
                  <td className="px-3 py-2.5 text-[#101828]">
                    {mv.text || <span className="text-[#8A94A3]">—</span>}
                    {(mv.actions?.length ?? 0) > 0 && (
                      <ul className="mt-1 space-y-0.5 text-[12px] text-[#475467]">
                        {mv.actions?.map((action, j) => (
                          <li key={j}>{action}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-[12.5px] text-[#475467]">
                    {mv.directives ?? ''}
                  </td>
                  <td className="px-3 py-2.5 text-right text-[#101828]">{mv.coef}</td>
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
                  <td className="px-3 py-2.5 text-right font-bold text-[#101828]">
                    {rowTotal(movementMarks[i], mv.coef)}
                  </td>
                </tr>
              ))}

              {def.collectives.length > 0 && (
                <tr className="border-t border-[#E7EAEE] bg-[#FBFCFD]">
                  <td
                    colSpan={6}
                    className="px-3 py-2 text-[10px] font-bold tracking-[.08em] text-[#475467] uppercase"
                  >
                    Collective marks
                  </td>
                </tr>
              )}
              {def.collectives.map((cm, i) => (
                <tr key={`c${String(i)}`} className="border-t border-[#EEF1F4] align-top">
                  <td className="px-3 py-2.5" />
                  <td className="px-3 py-2.5 font-semibold text-[#101828]">{cm.name || '—'}</td>
                  <td className="px-3 py-2.5 text-[12.5px] text-[#475467]">{cm.note ?? ''}</td>
                  <td className="px-3 py-2.5 text-right text-[#101828]">{cm.coef}</td>
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
                  <td className="px-3 py-2.5 text-right font-bold text-[#101828]">
                    {rowTotal(collectiveMarks[i], cm.coef)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-6 border-t border-[#E7EAEE] bg-[#FBFCFD] px-[26px] py-5">
          <div>
            <label
              htmlFor="ss-errors"
              className="mb-2 block text-[10.5px] font-bold tracking-[0.13em] text-[#475467] uppercase"
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
              <p className="mt-2 max-w-[260px] text-[12px] text-[#8A94A3]">
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
                <dt className="mb-1 text-[10px] font-bold tracking-[.08em] text-[#475467] uppercase">
                  {cell.label}
                </dt>
                <dd className={`${NR} text-[26px] leading-none text-[#101828]`}>{cell.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div
          className={cn(
            'px-[26px] py-3 text-[13px] font-bold',
            score.eligible ? 'bg-[#E7F6EE] text-[#15794F]' : 'bg-[#FEF3F2] text-[#B42318]',
          )}
        >
          {score.eligible
            ? `Championship-eligible (≥ ${String(ELIGIBILITY_THRESHOLD)}%)`
            : `Below ${String(ELIGIBILITY_THRESHOLD)}%`}
        </div>
      </div>

      {def.footNote && (
        <p className="text-[12.5px] leading-[1.55] text-[#8A94A3]">{def.footNote}</p>
      )}
    </div>
  );
}
