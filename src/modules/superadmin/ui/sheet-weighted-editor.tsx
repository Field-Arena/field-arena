'use client';

import type { Dispatch, SetStateAction } from 'react';
import { Input } from '@/shared/ui/shadcn/input';
import { parseCoefInput } from '@/modules/superadmin/utils/parse-coef-input';
import type { SheetDefShape } from '@/modules/superadmin/utils/read-sheet-def';
import { SECTION, H2, SMALL_INPUT } from '@/modules/superadmin/ui/sheet-detail-styles';
import { RowRemove } from '@/modules/superadmin/ui/sheet-row-remove';
import { AddRow } from '@/modules/superadmin/ui/sheet-add-row';

/* Weighted / 100: scored category sections summed toward 100. Legacy wtEditor.
 * The running weight total is shown because a sheet whose categories don't add
 * to 100 is the one thing that silently breaks this family's arithmetic. */
export function SheetWeightedEditor({
  def,
  setDef,
}: {
  def: SheetDefShape;
  setDef: Dispatch<SetStateAction<SheetDefShape>>;
}) {
  const totalWeight = def.categories.reduce((sum, c) => sum + (c.weight || 0), 0);
  const balanced = Math.abs(totalWeight - 100) < 0.001;

  return (
    <section className={SECTION}>
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className={H2}>Categories</h2>
        <span
          className="text-[12.5px] font-bold"
          style={{ color: balanced ? '#15794F' : '#B45309' }}
        >
          {totalWeight} / 100
          {!balanced && def.categories.length > 0 && ' — weights don’t total 100'}
        </span>
      </div>
      <p className="mb-4 text-[12.5px] text-[#8A94A3]">
        Each section carries a weight; the weighted marks sum toward 100.
      </p>

      <div className="mb-3.5 flex flex-col gap-2.5">
        {def.categories.length === 0 && (
          <p className="text-[13px] text-[#8A94A3]">Nothing here yet.</p>
        )}
        {def.categories.map((row, i) => (
          <div
            key={i}
            className="flex flex-wrap items-center gap-3 rounded-[10px] border border-[#E7EAEE] bg-white px-3.5 py-3"
          >
            <Input
              value={row.name}
              maxLength={200}
              placeholder="Category — e.g. Position and seat"
              aria-label={`Category ${String(i + 1)} name`}
              onChange={(e) => {
                setDef((d) => ({
                  ...d,
                  categories: d.categories.map((c, j) =>
                    j === i ? { ...c, name: e.target.value } : c,
                  ),
                }));
              }}
              className={`h-auto ${SMALL_INPUT} min-w-[150px] flex-[1_1_200px]`}
            />
            <Input
              value={row.criteria ?? ''}
              maxLength={2000}
              placeholder="Criteria"
              aria-label={`Category ${String(i + 1)} criteria`}
              onChange={(e) => {
                setDef((d) => ({
                  ...d,
                  categories: d.categories.map((c, j) =>
                    j === i ? { ...c, criteria: e.target.value } : c,
                  ),
                }));
              }}
              className={`h-auto ${SMALL_INPUT} min-w-[160px] flex-[1_1_240px]`}
            />
            <Input
              value={String(row.weight)}
              inputMode="decimal"
              placeholder="Weight"
              aria-label={`Category ${String(i + 1)} weight`}
              onChange={(e) => {
                const w = parseCoefInput(e.target.value, 100);
                setDef((d) => ({
                  ...d,
                  categories: d.categories.map((c, j) => (j === i ? { ...c, weight: w } : c)),
                }));
              }}
              className={`h-auto ${SMALL_INPUT} w-[86px] flex-none`}
            />
            <RowRemove
              label={`Remove category ${String(i + 1)}`}
              confirmTitle="Remove this category?"
              onClick={() => {
                setDef((d) => ({ ...d, categories: d.categories.filter((_, j) => j !== i) }));
              }}
            />
          </div>
        ))}
      </div>

      <AddRow
        label="+ Add category"
        onClick={() => {
          setDef((d) => ({
            ...d,
            categories: [...d.categories, { name: '', weight: 0, criteria: '' }],
          }));
        }}
      />
    </section>
  );
}
