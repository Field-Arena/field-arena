'use client';

import type { Dispatch, SetStateAction } from 'react';
import { Input } from '@/shared/ui/shadcn/input';
import { parseCoefInput } from '@/modules/superadmin/utils/parse-coef-input';
import type { SheetDefShape } from '@/modules/superadmin/utils/read-sheet-def';
import { SECTION, H2, SMALL_INPUT } from '@/modules/superadmin/ui/sheet-detail-styles';
import { RowRemove } from '@/modules/superadmin/ui/sheet-row-remove';
import { AddRow } from '@/modules/superadmin/ui/sheet-add-row';

export function SheetCollectivesEditor({
  def,
  setDef,
}: {
  def: SheetDefShape;
  setDef: Dispatch<SetStateAction<SheetDefShape>>;
}) {
  return (
    <section className={SECTION}>
      <h2 className={`${H2} mb-4`}>Collective marks</h2>
      <div className="mb-3.5 flex flex-col gap-2.5">
        {def.collectives.length === 0 && (
          <p className="text-[13px] text-[#8A94A3]">Nothing here yet.</p>
        )}
        {def.collectives.map((cm, i) => (
          <div
            key={i}
            className="flex flex-wrap items-center gap-3 rounded-[10px] border border-[#E7EAEE] bg-white px-3.5 py-3"
          >
            <Input
              value={cm.name}
              maxLength={200}
              placeholder="e.g. Gaits"
              aria-label={`Collective ${String(i + 1)} name`}
              onChange={(e) => {
                setDef((d) => ({
                  ...d,
                  collectives: d.collectives.map((c, j) =>
                    // `label` mirrors `name` so the scoring engine's collective
                    // parser (which keys off key/label) reads what is authored
                    // here. Without it the marks never reach a judge's sheet.
                    j === i ? { ...c, name: e.target.value, label: e.target.value } : c,
                  ),
                }));
              }}
              className={`h-auto ${SMALL_INPUT} min-w-[150px] flex-[1_1_180px]`}
            />
            <Input
              value={cm.note ?? ''}
              maxLength={1000}
              placeholder="Note — what this mark covers"
              aria-label={`Collective ${String(i + 1)} note`}
              onChange={(e) => {
                setDef((d) => ({
                  ...d,
                  collectives: d.collectives.map((c, j) =>
                    j === i ? { ...c, note: e.target.value } : c,
                  ),
                }));
              }}
              className={`h-auto ${SMALL_INPUT} min-w-[160px] flex-[1_1_220px]`}
            />
            <Input
              value={String(cm.coef)}
              inputMode="decimal"
              placeholder="Coef"
              aria-label={`Collective ${String(i + 1)} coefficient`}
              onChange={(e) => {
                const c = parseCoefInput(e.target.value, 20);
                setDef((d) => ({
                  ...d,
                  collectives: d.collectives.map((item, j) =>
                    j === i ? { ...item, coef: c } : item,
                  ),
                }));
              }}
              className={`h-auto ${SMALL_INPUT} w-[78px] flex-none`}
            />
            <RowRemove
              label={`Remove collective ${String(i + 1)}`}
              confirmTitle="Remove this collective mark?"
              onClick={() => {
                setDef((d) => ({
                  ...d,
                  collectives: d.collectives.filter((_, j) => j !== i),
                }));
              }}
            />
          </div>
        ))}
      </div>
      <AddRow
        label="+ Add collective"
        onClick={() => {
          setDef((d) => ({
            ...d,
            collectives: [
              ...d.collectives,
              {
                key: `c${String(d.collectives.length + 1)}`,
                name: '',
                label: '',
                note: '',
                coef: 1,
              },
            ],
          }));
        }}
      />
    </section>
  );
}
