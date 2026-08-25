'use client';

import type { Dispatch, SetStateAction } from 'react';
import { Input } from '@/shared/ui/shadcn/input';
import type { SheetDefShape } from '@/modules/superadmin/utils/read-sheet-def';
import { SECTION, H2, SMALL_INPUT } from '@/modules/superadmin/ui/sheet-detail-styles';
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
      </section>

      <section className={SECTION}>
        <h2 className={`${H2} mb-1.5`}>Movements</h2>
        <p className="mb-4 text-[12.5px] leading-[1.55] text-[#8A8275]">
          Each numbered movement: the test text as printed and its coefficient. % = (subtotal −
          errors) ÷ max.
        </p>
        <div className="mb-3.5 flex flex-col gap-2.5">
          {def.movements.length === 0 && (
            <p className="text-[13px] text-[#8A8275]">Nothing here yet.</p>
          )}
          {def.movements.map((mv, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-[10px] border border-[#E7E0D0] bg-white px-3.5 py-3"
            >
              <span className="flex-none text-[13px] font-bold text-[#16261F]">{mv.n}</span>
              <Input
                value={mv.text}
                placeholder="Test text as printed"
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
                label="Remove movement"
                onClick={() => {
                  setDef((d) => ({
                    ...d,
                    movements: d.movements
                      .filter((_, j) => j !== i)
                      .map((m, j) => ({ ...m, n: j + 1 })),
                  }));
                }}
              />
            </div>
          ))}
        </div>
        <AddRow
          label="+ Add movement"
          onClick={() => {
            setDef((d) => ({
              ...d,
              movements: [...d.movements, { n: d.movements.length + 1, text: '', coef: 1 }],
            }));
          }}
        />
      </section>
    </>
  );
}
