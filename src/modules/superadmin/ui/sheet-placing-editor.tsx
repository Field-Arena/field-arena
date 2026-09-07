'use client';

import type { Dispatch, SetStateAction } from 'react';
import type { SheetDefShape } from '@/modules/superadmin/utils/read-sheet-def';
import { SECTION, H2, LABEL, INPUT } from '@/modules/superadmin/ui/sheet-detail-styles';

/* Placing: rank-only, no marks. There is nothing to add rows for — just how
 * the placings are decided and what the judge weighs. Legacy plEditor. */
export function SheetPlacingEditor({
  def,
  setDef,
}: {
  def: SheetDefShape;
  setDef: Dispatch<SetStateAction<SheetDefShape>>;
}) {
  return (
    <section className={SECTION}>
      <h2 className={`${H2} mb-1.5`}>Placing</h2>
      <p className="mb-[18px] text-[12.5px] text-[#8A8275]">
        Horses are placed against each other rather than marked, so this sheet records the method
        and the criteria instead of movements.
      </p>

      <div className="grid gap-[18px]">
        <div>
          <label htmlFor="sd-method" className={LABEL}>
            Method
          </label>
          <textarea
            id="sd-method"
            rows={3}
            value={def.method}
            placeholder="How the class is judged and placed"
            onChange={(e) => {
              setDef((d) => ({ ...d, method: e.target.value }));
            }}
            className={`${INPUT} resize-y leading-[1.55]`}
          />
        </div>
        <div>
          <label htmlFor="sd-criteria" className={LABEL}>
            Criteria
          </label>
          <textarea
            id="sd-criteria"
            rows={5}
            value={def.criteria}
            placeholder="What the judge weighs, in order of importance"
            onChange={(e) => {
              setDef((d) => ({ ...d, criteria: e.target.value }));
            }}
            className={`${INPUT} resize-y leading-[1.55]`}
          />
        </div>
      </div>
    </section>
  );
}
