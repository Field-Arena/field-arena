'use client';

import type { Dispatch, SetStateAction } from 'react';
import { Input } from '@/shared/ui/shadcn/input';
import type { SheetDefShape } from '@/modules/superadmin/utils/read-sheet-def';
import {
  SECTION,
  H2,
  LABEL,
  INPUT,
  SMALL_INPUT,
} from '@/modules/superadmin/ui/sheet-detail-styles';
import { Field } from '@/modules/superadmin/ui/sheet-detail-field';
import { RowRemove } from '@/modules/superadmin/ui/sheet-row-remove';
import { AddRow } from '@/modules/superadmin/ui/sheet-add-row';

export function SheetMovementsEditor({
  def,
  setDef,
}: {
  def: SheetDefShape;
  setDef: Dispatch<SetStateAction<SheetDefShape>>;
}) {
  return (
    <>
      <section className={SECTION}>
        <h2 className={`${H2} mb-1.5`}>Sheet header</h2>
        <p className="mb-[18px] text-[12.5px] text-[#8A8275]">Masthead fields the judge sees.</p>
        <div className="grid [grid-template-columns:repeat(auto-fit,minmax(230px,1fr))] gap-[18px]">
          <Field
            label="Introduce (new movements)"
            value={def.intro}
            onChange={(v) => {
              setDef((d) => ({ ...d, intro: v }));
            }}
          />
          <Field
            label="Arena"
            value={def.arena}
            onChange={(v) => {
              setDef((d) => ({ ...d, arena: v }));
            }}
            placeholder="20x40 or 20x60"
          />
          <Field
            label="Average ride time"
            value={def.rideTime}
            onChange={(v) => {
              setDef((d) => ({ ...d, rideTime: v }));
            }}
            placeholder="5:00"
          />
          <Field
            label="Max points"
            value={def.maxPoints}
            onChange={(v) => {
              setDef((d) => ({ ...d, maxPoints: v }));
            }}
            placeholder="220"
          />
          <Field
            label="Error-of-course schedule"
            value={def.errorScheduleText}
            onChange={(v) => {
              setDef((d) => ({ ...d, errorScheduleText: v }));
            }}
            placeholder="1st = 2 pts · 2nd = elimination"
          />
        </div>

        <div className="mt-[18px] grid gap-[18px]">
          <div>
            <label htmlFor="sd-purpose" className={LABEL}>
              Purpose
            </label>
            <textarea
              id="sd-purpose"
              rows={2}
              value={def.purpose}
              placeholder="What this level asks the horse to confirm"
              onChange={(e) => {
                setDef((d) => ({ ...d, purpose: e.target.value }));
              }}
              className={`${INPUT} resize-y leading-[1.55]`}
            />
          </div>
          <div>
            <label htmlFor="sd-footnote" className={LABEL}>
              Foot note
            </label>
            <textarea
              id="sd-footnote"
              rows={2}
              value={def.footNote}
              placeholder="Anything printed at the bottom of the official sheet"
              onChange={(e) => {
                setDef((d) => ({ ...d, footNote: e.target.value }));
              }}
              className={`${INPUT} resize-y leading-[1.55]`}
            />
          </div>
        </div>
      </section>

      <section className={SECTION}>
        <h2 className={`${H2} mb-1.5`}>Movements</h2>
        <p className="mb-4 text-[12.5px] leading-[1.55] text-[#8A8275]">
          Each numbered movement: the test text as printed, the judge&rsquo;s directives, and its
          coefficient. % = (subtotal &minus; errors) &divide; max.
        </p>
        <div className="mb-3.5 flex flex-col gap-3">
          {def.movements.length === 0 && (
            <p className="text-[13px] text-[#8A8275]">Nothing here yet.</p>
          )}
          {def.movements.map((mv, i) => (
            <div key={i} className="rounded-[10px] border border-[#E7E0D0] bg-white px-3.5 py-3">
              <div className="flex items-center gap-3">
                <span className="w-6 flex-none text-[13px] font-bold text-[#16261F]">{mv.n}</span>
                <Input
                  value={mv.text}
                  placeholder="Test text as printed"
                  aria-label={`Movement ${String(mv.n)} test text`}
                  onChange={(e) => {
                    setDef((d) => ({
                      ...d,
                      movements: d.movements.map((m, j) =>
                        j === i ? { ...m, text: e.target.value } : m,
                      ),
                    }));
                  }}
                  className={`h-auto ${SMALL_INPUT} min-w-0 flex-1`}
                />
                <Input
                  value={String(mv.coef)}
                  placeholder="Coef"
                  aria-label={`Movement ${String(mv.n)} coefficient`}
                  onChange={(e) => {
                    const c = Number(e.target.value);
                    setDef((d) => ({
                      ...d,
                      movements: d.movements.map((m, j) =>
                        j === i ? { ...m, coef: Number.isFinite(c) ? c : 0 } : m,
                      ),
                    }));
                  }}
                  className={`h-auto ${SMALL_INPUT} w-[78px] flex-none`}
                />
                <RowRemove
                  label={`Remove movement ${String(mv.n)}`}
                  confirmTitle={`Remove movement ${String(mv.n)}?`}
                  onClick={() => {
                    setDef((d) => ({
                      ...d,
                      movements: d.movements
                        .filter((_, j) => j !== i)
                        .map((m, j) => ({ ...m, n: j + 1, num: j + 1 })),
                    }));
                  }}
                />
              </div>

              <div className="mt-2.5 grid [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))] gap-2.5 pl-9">
                <Input
                  value={mv.directives ?? ''}
                  placeholder="Directives — what the judge is marking"
                  aria-label={`Movement ${String(mv.n)} directives`}
                  onChange={(e) => {
                    setDef((d) => ({
                      ...d,
                      movements: d.movements.map((m, j) =>
                        j === i ? { ...m, directives: e.target.value } : m,
                      ),
                    }));
                  }}
                  className={`h-auto ${SMALL_INPUT} w-full`}
                />
                {/* One action per line, exactly as legacy's catEditActions split
                    and re-joined them. */}
                <textarea
                  rows={2}
                  value={(mv.actions ?? []).join('\n')}
                  placeholder={'Actions, one per line\ne.g. A — Enter working trot'}
                  aria-label={`Movement ${String(mv.n)} actions`}
                  onChange={(e) => {
                    const actions = e.target.value
                      .split('\n')
                      .map((line) => line.replace(/\s+$/, ''))
                      .filter((line) => line.length > 0);
                    setDef((d) => ({
                      ...d,
                      movements: d.movements.map((m, j) => (j === i ? { ...m, actions } : m)),
                    }));
                  }}
                  className={`${SMALL_INPUT} w-full resize-y leading-[1.5]`}
                />
              </div>
            </div>
          ))}
        </div>
        <AddRow
          label="+ Add movement"
          onClick={() => {
            setDef((d) => ({
              ...d,
              movements: [
                ...d.movements,
                {
                  n: d.movements.length + 1,
                  num: d.movements.length + 1,
                  text: '',
                  directives: '',
                  actions: [],
                  coef: 1,
                },
              ],
            }));
          }}
        />
      </section>
    </>
  );
}
