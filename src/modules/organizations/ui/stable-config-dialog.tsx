'use client';

import { useState } from 'react';
import { PromptDialog } from '@/shared/ui/prompt-dialog';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog';
import { Button } from '@/shared/ui/shadcn/button';
import { fa } from '@/shared/lib/organizer-theme';
import { resizeStalls } from '../utils';
import { VT_LABEL, VT_INPUT } from './venue-tokens';
import type { VenueStable } from '../types';

/**
 * "Stable — stalls" — the per-stall grid, ported from showstaff.html's
 * `renderLocStableConfigModal`/`locStallRename`/`locStallToggleClosed`
 * (~lines 5347-5417). The durable part of a stable: how many stalls, what
 * each is named, and which are out of service — deliberately no
 * horse/rider assignment, which stays a per-show runtime concern on
 * `shows.stable_chart`'s own Stable Chart.
 *
 * Rename opens this app's PromptDialog; toggle-closed is a direct click, matching legacy
 * exactly and the same native-dialog convention this codebase already uses
 * elsewhere (e.g. staff-edit-dialog.tsx's ConfirmDialog for "Remove from this
 * show").
 *
 * Renders as its own top-level Dialog rather than nested inside
 * VenueFormDialog's JSX — Radix portals both to document.body regardless of
 * where they're mounted, so this opens layered on top of the venue form the
 * same way legacy's #loc-stable-config-modal overlays #locationEditorHtml.
 */
export function StableConfigDialog({
  stable,
  open,
  onOpenChange,
  onChange,
}: {
  stable: VenueStable | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (next: VenueStable) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
        {stable && (
          <StableConfigBody stable={stable} onChange={onChange} onDone={() => { onOpenChange(false); }} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function StableConfigBody({
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
    const n = Math.max(0, Number(raw) || 0);
    onChange({ ...stable, stalls: resizeStalls(stalls, n) });
  }

  // The stall being renamed, or null. This app's own PromptDialog rather than
  // window.prompt(), which announces "localhost:3000 says" and cannot be styled.
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
        <DialogTitle className="font-serif text-xl text-hunter-deep">
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
        <input
          id="sc-count"
          type="number"
          min={0}
          value={stalls.length}
          className={VT_INPUT}
          onChange={(e) => {
            setCount(e.target.value);
          }}
        />
      </div>

      {stalls.length === 0 ? (
        <p className="my-4 text-[13px] text-[#7A8781]">Set a stall count above to build the grid.</p>
      ) : (
        <div
          className="my-4 grid gap-2"
          style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(64px,1fr))' }}
        >
          {stalls.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                rename(i);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                toggleClosed(i);
              }}
              title={`Click to rename, right-click to mark ${s.closed ? 'back in service' : 'out of service'}`}
              className="cursor-pointer rounded-lg px-1 py-2.5 text-[12.5px] font-bold"
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
            </button>
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
