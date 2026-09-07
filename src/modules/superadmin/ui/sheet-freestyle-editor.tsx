'use client';

import type { Dispatch, SetStateAction } from 'react';
import { Input } from '@/shared/ui/shadcn/input';
import type { SheetDefShape } from '@/modules/superadmin/utils/read-sheet-def';
import { SECTION, H2, SMALL_INPUT } from '@/modules/superadmin/ui/sheet-detail-styles';
import { RowRemove } from '@/modules/superadmin/ui/sheet-row-remove';
import { AddRow } from '@/modules/superadmin/ui/sheet-add-row';

/* Freestyle: two independent panels — Technical (what was ridden) and
 * Artistic (how it was presented, coefficient-weighted). Legacy fsEditor. */
export function SheetFreestyleEditor({
  def,
  setDef,
}: {
  def: SheetDefShape;
  setDef: Dispatch<SetStateAction<SheetDefShape>>;
}) {
  return (
    <>
      <section className={SECTION}>
        <h2 className={`${H2} mb-1.5`}>Technical panel</h2>
        <p className="mb-4 text-[12.5px] text-[#8A8275]">
          The required elements, and what the judge is looking for in each.
        </p>
        <div className="mb-3.5 flex flex-col gap-2.5">
          {def.technical.length === 0 && (
            <p className="text-[13px] text-[#8A8275]">Nothing here yet.</p>
          )}
          {def.technical.map((row, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center gap-3 rounded-[10px] border border-[#E7E0D0] bg-white px-3.5 py-3"
            >
              <Input
                value={row.name}
                placeholder="Element — e.g. Halt / rein back"
                aria-label={`Technical element ${String(i + 1)} name`}
                onChange={(e) => {
                  setDef((d) => ({
                    ...d,
                    technical: d.technical.map((t, j) =>
                      j === i ? { ...t, name: e.target.value } : t,
                    ),
                  }));
                }}
                className={`h-auto ${SMALL_INPUT} min-w-[150px] flex-[1_1_200px]`}
              />
              <Input
                value={row.criteria ?? ''}
                placeholder="Criteria"
                aria-label={`Technical element ${String(i + 1)} criteria`}
                onChange={(e) => {
                  setDef((d) => ({
                    ...d,
                    technical: d.technical.map((t, j) =>
                      j === i ? { ...t, criteria: e.target.value } : t,
                    ),
                  }));
                }}
                className={`h-auto ${SMALL_INPUT} min-w-[160px] flex-[1_1_260px]`}
              />
              <RowRemove
                label={`Remove technical element ${String(i + 1)}`}
                confirmTitle="Remove this technical element?"
                onClick={() => {
                  setDef((d) => ({ ...d, technical: d.technical.filter((_, j) => j !== i) }));
                }}
              />
            </div>
          ))}
        </div>
        <AddRow
          label="+ Add element"
          onClick={() => {
            setDef((d) => ({ ...d, technical: [...d.technical, { name: '', criteria: '' }] }));
          }}
        />
      </section>

      <section className={SECTION}>
        <h2 className={`${H2} mb-1.5`}>Artistic panel</h2>
        <p className="mb-4 text-[12.5px] text-[#8A8275]">
          Presentation marks and their coefficients.
        </p>
        <div className="mb-3.5 flex flex-col gap-2.5">
          {def.artistic.length === 0 && (
            <p className="text-[13px] text-[#8A8275]">Nothing here yet.</p>
          )}
          {def.artistic.map((row, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center gap-3 rounded-[10px] border border-[#E7E0D0] bg-white px-3.5 py-3"
            >
              <Input
                value={row.name}
                placeholder="Mark — e.g. Harmony"
                aria-label={`Artistic mark ${String(i + 1)} name`}
                onChange={(e) => {
                  setDef((d) => ({
                    ...d,
                    artistic: d.artistic.map((a, j) =>
                      j === i ? { ...a, name: e.target.value } : a,
                    ),
                  }));
                }}
                className={`h-auto ${SMALL_INPUT} min-w-[150px] flex-[1_1_180px]`}
              />
              <Input
                value={row.criteria ?? ''}
                placeholder="Criteria"
                aria-label={`Artistic mark ${String(i + 1)} criteria`}
                onChange={(e) => {
                  setDef((d) => ({
                    ...d,
                    artistic: d.artistic.map((a, j) =>
                      j === i ? { ...a, criteria: e.target.value } : a,
                    ),
                  }));
                }}
                className={`h-auto ${SMALL_INPUT} min-w-[160px] flex-[1_1_240px]`}
              />
              <Input
                value={String(row.coef)}
                placeholder="Coef"
                aria-label={`Artistic mark ${String(i + 1)} coefficient`}
                onChange={(e) => {
                  const c = Number(e.target.value);
                  setDef((d) => ({
                    ...d,
                    artistic: d.artistic.map((a, j) =>
                      j === i ? { ...a, coef: Number.isFinite(c) ? c : 0 } : a,
                    ),
                  }));
                }}
                className={`h-auto ${SMALL_INPUT} w-[78px] flex-none`}
              />
              <RowRemove
                label={`Remove artistic mark ${String(i + 1)}`}
                confirmTitle="Remove this artistic mark?"
                onClick={() => {
                  setDef((d) => ({ ...d, artistic: d.artistic.filter((_, j) => j !== i) }));
                }}
              />
            </div>
          ))}
        </div>
        <AddRow
          label="+ Add artistic mark"
          onClick={() => {
            setDef((d) => ({
              ...d,
              artistic: [...d.artistic, { name: '', coef: 1, criteria: '' }],
            }));
          }}
        />
      </section>
    </>
  );
}
