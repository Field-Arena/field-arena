'use client';

import type { Dispatch, SetStateAction } from 'react';
import type { SheetDefShape } from '../utils';
import { SECTION, H2, SMALL_INPUT } from './sheet-detail-styles';
import { RowRemove, AddRow } from './sheet-movements-editor';

/** The collective-marks editor for a movement-family sheet. Extracted from SheetDetail. */
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
          <p className="text-[13px] text-[#8A8275]">Nothing here yet.</p>
        )}
        {def.collectives.map((cm, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-[10px] border border-[#E7E0D0] bg-white px-3.5 py-3"
          >
            <input
              value={cm.name}
              placeholder="e.g. Gaits"
              onChange={(e) => {
                setDef((d) => ({
                  ...d,
                  collectives: d.collectives.map((c, j) =>
                    j === i ? { ...c, name: e.target.value } : c
                  ),
                }));
              }}
              className={`${SMALL_INPUT} min-w-0 flex-1`}
            />
            <input
              value={String(cm.coef)}
              placeholder="Coef"
              onChange={(e) => {
                const c = Number(e.target.value);
                setDef((d) => ({
                  ...d,
                  collectives: d.collectives.map((cc, j) =>
                    j === i ? { ...cc, coef: Number.isFinite(c) ? c : 0 } : cc
                  ),
                }));
              }}
              className={`${SMALL_INPUT} w-[78px] flex-none`}
            />
            <RowRemove
              label="Remove collective"
              onClick={() => {
                setDef((d) => ({ ...d, collectives: d.collectives.filter((_, j) => j !== i) }));
              }}
            />
          </div>
        ))}
      </div>
      <AddRow
        label="+ Add collective"
        onClick={() => {
          setDef((d) => ({ ...d, collectives: [...d.collectives, { name: '', coef: 1 }] }));
        }}
      />
    </section>
  );
}
