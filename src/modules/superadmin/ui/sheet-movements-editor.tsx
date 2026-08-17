'use client';

import type { Dispatch, SetStateAction } from 'react';
import { Trash2Icon } from 'lucide-react';
import type { SheetDefShape } from '../utils';
import { SECTION, H2, SMALL_INPUT } from './sheet-detail-styles';
import { Field } from './sheet-details-form';

/**
 * Movement-family sheet header fields (arena, ride time, max points, …) plus
 * the numbered movements list. Extracted from SheetDetail; `def` state is
 * still owned by the parent so Save can rebuild the whole `def` payload in one
 * shot from every section's edits.
 */
export function SheetMovementsEditor({
  def,
  setDef,
}: {
  def: SheetDefShape;
  setDef: Dispatch<SetStateAction<SheetDefShape>>;
}) {
  return (
    <>
      {/* Sheet header */}
      <section className={SECTION}>
        <h2 className={`${H2} mb-1.5`}>Sheet header</h2>
        <p className="mb-[18px] text-[12.5px] text-[#8A8275]">Masthead fields the judge sees.</p>
        <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fit,minmax(230px,1fr))]">
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

      {/* Movements */}
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
              <input
                value={mv.text}
                placeholder="Test text as printed"
                onChange={(e) => {
                  setDef((d) => ({
                    ...d,
                    movements: d.movements.map((m, j) =>
                      j === i ? { ...m, text: e.target.value } : m
                    ),
                  }));
                }}
                className={`${SMALL_INPUT} min-w-0 flex-1`}
              />
              <input
                value={String(mv.coef)}
                placeholder="Coef"
                onChange={(e) => {
                  const c = Number(e.target.value);
                  setDef((d) => ({
                    ...d,
                    movements: d.movements.map((m, j) =>
                      j === i ? { ...m, coef: Number.isFinite(c) ? c : 0 } : m
                    ),
                  }));
                }}
                className={`${SMALL_INPUT} w-[78px] flex-none`}
              />
              <RowRemove
                label="Remove movement"
                onClick={() => {
                  setDef((d) => ({
                    ...d,
                    movements: d.movements.filter((_, j) => j !== i).map((m, j) => ({ ...m, n: j + 1 })),
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

export function RowRemove({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-[30px] flex-none place-items-center rounded-[7px] border border-transparent text-[#B4432F] transition-colors hover:border-[#F0D3CE] hover:bg-[#FCF1EF]"
    >
      <Trash2Icon className="size-[14px]" aria-hidden />
    </button>
  );
}

export function AddRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-[#C4D3CB] bg-white px-3.5 py-2.5 text-[13px] font-semibold text-hunter-deep transition-colors hover:border-gold"
    >
      {label}
    </button>
  );
}
