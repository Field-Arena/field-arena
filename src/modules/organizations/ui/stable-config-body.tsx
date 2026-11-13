'use client';

import { useState } from 'react';
import { PromptDialog } from '@/shared/ui/prompt-dialog';
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { MAX_STALLS_PER_STABLE } from '@/modules/organizations/constants';
import { blockNonIntegerKeys } from '@/shared/lib/format/number-input';
import { fa } from '@/shared/lib/organizer-theme';
import { resizeStalls } from '@/modules/organizations/utils/resize-stalls';
import { VT_LABEL, VT_INPUT } from '@/modules/organizations/ui/venue-tokens';
import type { VenueStable } from '@/modules/organizations/types';

export function StableConfigBody({
  stable,
  onChange,
  onDone,
}: {
  stable: VenueStable;
  onChange: (next: VenueStable) => void;
  onDone: () => void;
}) {
  const stalls = stable.stalls;

  function setCount(raw: string) {
    const n = Math.min(MAX_STALLS_PER_STABLE, Math.max(0, Math.trunc(Number(raw)) || 0));
    onChange({ ...stable, stalls: resizeStalls(stalls, n) });
  }

  const [renamingIndex, setRenamingIndex] = useState<number | null>(null);
  const renamingStall = renamingIndex == null ? null : stalls[renamingIndex];

  function rename(index: number) {
    setRenamingIndex(index);
  }

  function toggleClosed(index: number) {
    const stall = stalls[index];
    if (!stall) return;
    onChange({
      ...stable,
      stalls: stalls.map((s, i) => (i === index ? { ...s, closed: !s.closed } : s)),
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-serif text-xl text-[#101828]">
          {stable.name || 'Stable'} — stalls
        </DialogTitle>
        <DialogDescription>
          Click a stall to rename it. Right-click (or long-press) to mark it out of service.
        </DialogDescription>
      </DialogHeader>

      <div className="max-w-[160px]">
        <label htmlFor="sc-count" className={VT_LABEL}>
          Number of stalls
        </label>
        <Input
          id="sc-count"
          type="number"
          min={0}
          max={MAX_STALLS_PER_STABLE}
          step={1}
          value={stalls.length}
          onKeyDown={blockNonIntegerKeys}
          className={`h-auto ${VT_INPUT}`}
          onChange={(e) => {
            setCount(e.target.value);
          }}
        />
      </div>

      {stalls.length === 0 ? (
        <p className="my-4 text-[13px] text-[#8A94A3]">
          Set a stall count above to build the grid.
        </p>
      ) : (
        <div
          className="my-4 grid gap-2"
          style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(64px,1fr))' }}
        >
          {stalls.map((s, i) => (
            <Button
              key={s.id}
              type="button"
              variant="ghost"
              onClick={() => {
                rename(i);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                toggleClosed(i);
              }}
              title={`Click to rename, right-click to mark ${s.closed ? 'back in service' : 'out of service'}`}
              className="h-auto cursor-pointer rounded-lg px-1 py-2.5 text-[12.5px] font-bold hover:bg-transparent"
              style={
                s.closed
                  ? {
                      border: '1px dashed ' + fa.muted,
                      background: '#F2F0EA',
                      color: fa.muted,
                      textDecoration: 'line-through',
                    }
                  : { border: `1px solid ${fa.green}`, background: fa.greenTint, color: fa.green }
              }
            >
              {s.label}
            </Button>
          ))}
        </div>
      )}

      <DialogFooter>
        <Button type="button" onClick={onDone}>
          Done
        </Button>
      </DialogFooter>

      <PromptDialog
        open={renamingStall != null}
        onOpenChange={(next) => {
          if (!next) setRenamingIndex(null);
        }}
        title="Rename stall"
        label="Stall name"
        maxLength={20}
        placeholder='e.g. "C4"'
        defaultValue={renamingStall?.label ?? ''}
        onSubmit={(label) => {
          const index = renamingIndex;
          if (index == null) return;
          onChange({
            ...stable,
            stalls: stalls.map((s, i) => (i === index ? { ...s, label } : s)),
          });
          setRenamingIndex(null);
        }}
      />
    </>
  );
}
