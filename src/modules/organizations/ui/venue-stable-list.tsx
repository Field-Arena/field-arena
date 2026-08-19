'use client';

import { Input } from '@/shared/ui/shadcn/input';
import { Button } from '@/shared/ui/shadcn/button';
import { VT_ROW_INPUT, VT_NOTE, VT_SECTION_LABEL } from '@/modules/organizations/ui/venue-tokens';
import type { VenueStable } from '@/modules/organizations/types';

export function VenueStableList({
  stables,
  onRename,
  onSetRows,
  onRemove,
  onAdd,
  onConfigure,
}: {
  stables: VenueStable[];
  onRename: (index: number, name: string) => void;
  onSetRows: (index: number, rowCount: number) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
  onConfigure: (index: number) => void;
}) {
  return (
    <div className="border-t border-[#E9EDEB] pt-4">
      <label className={VT_SECTION_LABEL}>Stables at this location</label>
      <p className={VT_NOTE}>
        Build the real stall layout once here — name each stall, mark any out of service — and every
        show at this venue picks it up ready to go, with the same stall names on the printed signage
        every time.
      </p>

      {stables.length === 0 ? (
        <p className="mb-2.5 text-[13px] text-[#7A8781] italic">
          No stables yet — add at least one
        </p>
      ) : (
        <div className="mb-2.5 flex flex-col gap-2">
          {stables.map((stable, i) => {
            const stallCount = stable.stalls.length;
            const closedCount = stable.stalls.filter((s) => s.closed).length;
            return (
              <div key={i} className="rounded-[10px] border border-[#EDF0EE] p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Input
                    value={stable.name}
                    aria-label="Stable name"
                    placeholder="e.g. Stable A, North Barn"
                    className={`h-auto ${VT_ROW_INPUT} flex-1`}
                    onChange={(e) => {
                      onRename(i, e.target.value);
                    }}
                  />
                  <label className="flex items-center gap-1.5 text-[11px] whitespace-nowrap text-[#7A8781]">
                    Rows
                    <Input
                      type="number"
                      min={1}
                      value={stable.rowCount}
                      className="h-auto w-[52px] rounded-lg border border-[#D9E1DD] px-2 py-1.5 text-[12.5px]"
                      onChange={(e) => {
                        onSetRows(i, parseInt(e.target.value, 10) || 1);
                      }}
                    />
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-status-danger h-auto bg-transparent px-0 py-0 text-[12.5px] font-semibold whitespace-nowrap hover:bg-transparent hover:underline"
                    onClick={() => {
                      onRemove(i);
                    }}
                  >
                    Remove
                  </Button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <span className="text-[12.5px] text-[#6E7C76]">
                    {stallCount
                      ? `${String(stallCount)} stall${stallCount === 1 ? '' : 's'} built${closedCount ? ` · ${String(closedCount)} out of service` : ''}`
                      : 'No stalls built yet'}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    className="hover:border-gold h-auto rounded-[9px] border border-[#D9E1DD] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#0D2C23] transition-colors hover:bg-white"
                    onClick={() => {
                      onConfigure(i);
                    }}
                  >
                    {stallCount ? 'Configure stalls →' : 'Build stalls →'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Button
        type="button"
        variant="ghost"
        className="hover:border-gold h-auto rounded-[10px] border border-[#D9E1DD] bg-white px-[15px] py-2.5 text-[13px] font-semibold text-[#0D2C23] transition-colors hover:bg-white"
        onClick={onAdd}
      >
        + Add stable
      </Button>
    </div>
  );
}
