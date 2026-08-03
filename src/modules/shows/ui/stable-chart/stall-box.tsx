'use client';

import { useState, type MouseEvent } from 'react';
import { fa } from '@/shared/lib/organizer-theme';
import { cn } from '@/shared/lib/utils';
import { truncateHorseName } from '../../utils';
import { useRenameStall, useToggleStallClosed } from '../../hooks/use-stable-chart-mutations';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { PromptDialog } from '@/shared/ui/prompt-dialog';
import type { StableChartStall } from '../../data/stable-chart-queries';

/**
 * One stall — ported from showstaff.html's `stallBoxHtml` (~14008). Click to
 * rename (unless closed), a self-contained Open/Closed pill that toggles
 * without triggering the rename click (`stopPropagation`, same as legacy).
 *
 * Rename and the closing-an-occupied-stall warning both use this app's own
 * dialogs (PromptDialog / ConfirmDialog) rather than `window.prompt()` and
 * `window.confirm()`. The native ones announce "localhost:3000 says", cannot
 * be styled, and block the tab — every confirm across this app was moved off
 * them for the same reason.
 */
export function StallBox({
  showId,
  stableId,
  stall,
}: {
  showId: string;
  stableId: string;
  stall: StableChartStall;
}) {
  const rename = useRenameStall();
  const toggleClosed = useToggleStallClosed();

  const occupied = !!(stall.horseId ?? stall.horseName);
  const closed = stall.closed;

  const [renaming, setRenaming] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  function handleRename() {
    if (closed) return;
    setRenaming(true);
  }

  function handleToggleClosed(event: MouseEvent) {
    event.stopPropagation();
    // Only closing an occupied stall needs a warning — it clears the horse's
    // assignment. Reopening one takes nothing away.
    if (!closed && occupied) {
      setConfirmClose(true);
      return;
    }
    toggleClosed.mutate({ showId, stableId, stallId: stall.id });
  }

  const borderColor = closed ? fa.red : occupied ? fa.green : fa.field;
  const bgColor = closed ? fa.redTint : occupied ? fa.greenTint : fa.cream;

  return (
    <div
      role={closed ? undefined : 'button'}
      tabIndex={closed ? undefined : 0}
      onClick={handleRename}
      onKeyDown={(event) => {
        if (closed) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleRename();
        }
      }}
      title={closed ? 'This stall is closed — click Open to reopen it' : 'Click to rename this stall'}
      className={cn(
        'min-w-[120px] rounded-lg border-2 px-2.5 py-2 text-center',
        closed ? 'cursor-default' : 'cursor-pointer'
      )}
      style={{ borderColor, background: bgColor }}
    >
      <div className="text-[13px] font-extrabold" style={{ color: closed ? fa.red : fa.inkDeep }}>
        {stall.label}
      </div>

      {!closed && occupied && (
        <>
          <div className="mt-0.5 truncate text-[11px] text-[#7A8781]">
            {truncateHorseName(stall.riderName ?? '')}
          </div>
          <div className="truncate text-[11px] font-bold text-ink-deep">
            {truncateHorseName(stall.horseName ?? '')}
            {stall.isStallion && (
              <span title="Stallion" style={{ color: fa.goldFg }}>
                {' '}
                ♂
              </span>
            )}
          </div>
          <div className="mt-0.5 text-[10.5px] text-[#7A8781]">🛏 {stall.shavings} shavings</div>
        </>
      )}

      {!closed && !occupied && <div className="mt-0.5 text-[11px] text-[#7A8781]">Empty</div>}

      <button
        type="button"
        onClick={handleToggleClosed}
        disabled={toggleClosed.isPending}
        className="mt-1 rounded-md border px-2.5 py-0.5 text-[10.5px] font-bold"
        style={{
          borderColor: closed ? fa.red : fa.green,
          background: closed ? fa.redTint : fa.greenTint,
          color: closed ? fa.red : fa.green,
          textDecoration: closed ? 'line-through' : 'none',
        }}
      >
        {closed ? 'Closed' : 'Open'}
      </button>

      <PromptDialog
        open={renaming}
        onOpenChange={setRenaming}
        title="Rename stall"
        label="Stall name"
        placeholder='e.g. "C4"'
        defaultValue={stall.label}
        pending={rename.isPending}
        onSubmit={(label) => {
          if (label !== stall.label) {
            rename.mutate({ showId, stableId, stallId: stall.id, label });
          }
          setRenaming(false);
        }}
      />

      <ConfirmDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title="Close this stall?"
        description={`It is occupied by ${stall.horseName ?? 'a horse'}. Closing it will clear that assignment.`}
        confirmLabel={toggleClosed.isPending ? 'Closing…' : 'Close stall'}
        destructive
        pending={toggleClosed.isPending}
        onConfirm={() => {
          toggleClosed.mutate(
            { showId, stableId, stallId: stall.id },
            {
              onSuccess: () => {
                setConfirmClose(false);
              },
            }
          );
        }}
      />
    </div>
  );
}
