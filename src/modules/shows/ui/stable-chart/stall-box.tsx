'use client';

import { useState, type MouseEvent } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { EllipsisVerticalIcon } from 'lucide-react';
import { fa } from '@/shared/lib/organizer-theme';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog';
import { Textarea } from '@/shared/ui/shadcn/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/shadcn/dropdown-menu';
import { truncateHorseName } from '@/modules/shows/utils/truncate-horse-name';
import {
  useRenameStall,
  useSetStallStatus,
  useUnassignStall,
  useUpdateStallNote,
  useReassignStall,
  useSwapStalls,
} from '@/modules/shows/hooks/use-stable-chart-mutations';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { PromptDialog } from '@/shared/ui/prompt-dialog';
import { STALL_STATUS_LABELS } from '@/modules/shows/constants';
import { buildStallDndId } from '@/modules/shows/utils/stall-dnd-id';
import type {
  StableChartStable,
  StableChartStall,
  StallStatus,
} from '@/modules/shows/data/stable-chart-queries';

type BlockableStatus = Extract<StallStatus, 'reserved' | 'unusable' | 'tack' | 'hold'>;

const STALL_STATUS_STYLES: Record<StallStatus, { border: string; bg: string; fg: string }> = {
  available: { border: fa.field, bg: fa.cream, fg: fa.inkDeep },
  occupied: { border: fa.green, bg: fa.greenTint, fg: fa.inkDeep },
  reserved: { border: fa.gold, bg: fa.goldTint, fg: fa.goldFg },
  unusable: { border: fa.red, bg: fa.redTint, fg: fa.red },
  tack: { border: fa.blue, bg: '#E7F0F9', fg: '#1F4E80' },
  hold: { border: '#8A6D14', bg: '#F3ECDC', fg: '#6B540F' },
};

const BLOCKABLE_STATUSES: BlockableStatus[] = ['reserved', 'unusable', 'tack', 'hold'];

// A prompt that allows an empty submission — unlike PromptDialog, which
// treats blank input as "cancel." Used for both the optional block/hold
// reason and the free-form stall note.
function TextAreaDialog({
  open,
  onOpenChange,
  title,
  description,
  label,
  defaultValue,
  placeholder,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  label: string;
  defaultValue: string;
  placeholder?: string;
  pending: boolean;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setValue(defaultValue);
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-[420px]">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(value.trim());
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-hunter-deep font-serif text-xl">{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>

          <div className="my-4">
            <label className="mb-1.5 block text-[13px] font-semibold">{label}</label>
            <Textarea
              autoFocus
              rows={3}
              value={value}
              placeholder={placeholder}
              disabled={pending}
              onChange={(event) => {
                setValue(event.target.value);
              }}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface TargetOption {
  stableId: string;
  stallId: string;
  label: string;
}

function TargetStallPickerDialog({
  open,
  onOpenChange,
  title,
  options,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  options: TargetOption[];
  pending: boolean;
  onSubmit: (target: { stableId: string; stallId: string }) => void;
}) {
  const [value, setValue] = useState('');

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setValue('');
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle className="text-hunter-deep font-serif text-xl">{title}</DialogTitle>
          {options.length === 0 && (
            <DialogDescription>No eligible stalls right now.</DialogDescription>
          )}
        </DialogHeader>

        {options.length > 0 && (
          <select
            className="border-line-mint w-full rounded-lg border px-3 py-2 text-[13px]"
            value={value}
            disabled={pending}
            onChange={(event) => {
              setValue(event.target.value);
            }}
          >
            <option value="">— choose a stall —</option>
            {options.map((opt) => (
              <option
                key={`${opt.stableId}:${opt.stallId}`}
                value={`${opt.stableId}:${opt.stallId}`}
              >
                {opt.label}
              </option>
            ))}
          </select>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => {
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={pending || !value}
            onClick={() => {
              const [pickedStableId, pickedStallId] = value.split(':');
              if (pickedStableId && pickedStallId) {
                onSubmit({ stableId: pickedStableId, stallId: pickedStallId });
              }
            }}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function StallBox({
  showId,
  stableId,
  stall,
  allStables,
}: {
  showId: string;
  stableId: string;
  stall: StableChartStall;
  allStables: StableChartStable[];
}) {
  const rename = useRenameStall();
  const setStatus = useSetStallStatus();
  const unassign = useUnassignStall();
  const updateNote = useUpdateStallNote();
  const reassign = useReassignStall();
  const swap = useSwapStalls();

  const occupied = stall.status === 'occupied';
  const blocked = BLOCKABLE_STATUSES.includes(stall.status as BlockableStatus);

  const [renaming, setRenaming] = useState(false);
  const [reasonPrompt, setReasonPrompt] = useState<BlockableStatus | null>(null);
  const [notePrompt, setNotePrompt] = useState(false);
  const [confirmUnassign, setConfirmUnassign] = useState(false);
  const [confirmClearFor, setConfirmClearFor] = useState<BlockableStatus | null>(null);
  const [movePicker, setMovePicker] = useState(false);
  const [swapPicker, setSwapPicker] = useState(false);

  const dndId = buildStallDndId(stableId, stall.id);
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
  } = useDraggable({
    id: dndId,
    disabled: !occupied,
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: dndId,
    disabled: stall.status !== 'available' && stall.status !== 'occupied',
  });

  const busy = setStatus.isPending || unassign.isPending || updateNote.isPending;

  function handleRename() {
    if (stall.status === 'unusable') return;
    setRenaming(true);
  }

  function selectBlockableStatus(target: BlockableStatus) {
    if (occupied) {
      setConfirmClearFor(target);
      return;
    }
    if (target === 'tack') {
      setStatus.mutate({ showId, stableId, stallId: stall.id, status: target });
      return;
    }
    setReasonPrompt(target);
  }

  const styles = STALL_STATUS_STYLES[stall.status];

  const moveOptions: TargetOption[] = allStables.flatMap((s) =>
    s.stalls
      .filter((st) => st.status === 'available')
      .map((st) => ({ stableId: s.id, stallId: st.id, label: `${s.name} — ${st.label}` })),
  );
  const swapOptions: TargetOption[] = allStables.flatMap((s) =>
    s.stalls
      .filter((st) => st.status === 'occupied' && st.id !== stall.id)
      .map((st) => ({
        stableId: s.id,
        stallId: st.id,
        label: `${s.name} — ${st.label} (${st.horseName ?? 'a horse'})`,
      })),
  );

  return (
    <div
      ref={(node) => {
        setDragRef(node);
        setDropRef(node);
      }}
      {...listeners}
      {...attributes}
      role={stall.status === 'unusable' ? undefined : 'button'}
      tabIndex={stall.status === 'unusable' ? undefined : 0}
      onClick={handleRename}
      onKeyDown={(event) => {
        if (stall.status === 'unusable') return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleRename();
        }
      }}
      title={
        stall.status === 'unusable'
          ? 'This stall is unusable — use the menu to make it available again'
          : occupied
            ? 'Click to rename, or drag to move this horse to another stall'
            : 'Click to rename this stall'
      }
      className={cn(
        'relative min-w-[130px] rounded-lg border-2 px-2.5 py-2 text-center',
        stall.status === 'unusable' ? 'cursor-default' : 'cursor-pointer',
      )}
      style={{
        borderColor: styles.border,
        background: styles.bg,
        outline: isOver ? `2px solid ${fa.gold}` : undefined,
        outlineOffset: isOver ? 2 : undefined,
      }}
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`More actions for stall ${stall.label}`}
          onClick={(event: MouseEvent) => {
            event.stopPropagation();
          }}
          className="text-fa-muted-2 absolute top-1 right-1 grid size-6 place-items-center rounded-md hover:bg-black/5"
        >
          <EllipsisVerticalIcon className="size-3.5" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-48"
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          {occupied && (
            <DropdownMenuItem
              onSelect={() => {
                setMovePicker(true);
              }}
            >
              Move horse
            </DropdownMenuItem>
          )}
          {occupied && (
            <DropdownMenuItem
              onSelect={() => {
                setSwapPicker(true);
              }}
            >
              Swap stall
            </DropdownMenuItem>
          )}
          {occupied && (
            <DropdownMenuItem
              onSelect={() => {
                setConfirmUnassign(true);
              }}
            >
              Unassign
            </DropdownMenuItem>
          )}
          {blocked && (
            <DropdownMenuItem
              onSelect={() => {
                setStatus.mutate({ showId, stableId, stallId: stall.id, status: 'available' });
              }}
            >
              Make available
            </DropdownMenuItem>
          )}
          {(occupied || blocked) && <DropdownMenuSeparator />}
          <DropdownMenuItem
            onSelect={() => {
              selectBlockableStatus('tack');
            }}
          >
            Mark as tack stall
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              selectBlockableStatus('reserved');
            }}
          >
            Reserve
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              selectBlockableStatus('unusable');
            }}
          >
            Block stall
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              selectBlockableStatus('hold');
            }}
          >
            Hold
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              setNotePrompt(true);
            }}
          >
            {stall.note ? 'Edit note' : 'Add note'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="text-[13px] font-extrabold" style={{ color: styles.fg }}>
        {stall.label}
      </div>

      {stall.status !== 'available' && stall.status !== 'occupied' && (
        <div className="mt-0.5 text-[11px] font-bold" style={{ color: styles.fg }}>
          {STALL_STATUS_LABELS[stall.status]}
        </div>
      )}
      {stall.statusReason && (
        <div className="mt-0.5 truncate text-[10px] text-[#7A8781]" title={stall.statusReason}>
          {stall.statusReason}
        </div>
      )}

      {occupied && (
        <>
          <div className="mt-0.5 truncate text-[11px] text-[#7A8781]">
            {truncateHorseName(stall.riderName ?? '')}
          </div>
          <div className="text-ink-deep truncate text-[11px] font-bold">
            {truncateHorseName(stall.horseName ?? '')}
            {stall.isStallion && (
              <span title="Stallion" style={{ color: fa.goldFg }}>
                {' '}
                ♂
              </span>
            )}
          </div>
          {stall.trainerName && (
            <div className="truncate text-[10px] text-[#7A8781]">{stall.trainerName}</div>
          )}
          <div className="mt-0.5 text-[10.5px] text-[#7A8781]">🛏 {stall.shavings} shavings</div>
        </>
      )}

      {stall.status === 'available' && (
        <div className="mt-0.5 text-[11px] text-[#7A8781]">Available</div>
      )}

      {stall.note && (
        <div className="mt-1 truncate text-[10px] text-[#7A8781] italic" title={stall.note}>
          📝 {stall.note}
        </div>
      )}

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

      <TextAreaDialog
        open={reasonPrompt !== null}
        onOpenChange={(open) => {
          if (!open) setReasonPrompt(null);
        }}
        title={reasonPrompt ? `${STALL_STATUS_LABELS[reasonPrompt]} — reason (optional)` : ''}
        label="Reason"
        placeholder="e.g. Door broken"
        defaultValue=""
        pending={busy}
        onSubmit={(reason) => {
          if (reasonPrompt) {
            setStatus.mutate(
              {
                showId,
                stableId,
                stallId: stall.id,
                status: reasonPrompt,
                reason: reason || undefined,
              },
              {
                onSuccess: () => {
                  setReasonPrompt(null);
                },
              },
            );
          }
        }}
      />

      <TextAreaDialog
        open={notePrompt}
        onOpenChange={setNotePrompt}
        title="Stall note"
        label="Note"
        placeholder="e.g. Needs extra shavings"
        defaultValue={stall.note ?? ''}
        pending={busy}
        onSubmit={(note) => {
          updateNote.mutate(
            { showId, stableId, stallId: stall.id, note: note || null },
            {
              onSuccess: () => {
                setNotePrompt(false);
              },
            },
          );
        }}
      />

      <ConfirmDialog
        open={confirmUnassign}
        onOpenChange={setConfirmUnassign}
        title="Unassign this stall?"
        description={`It is occupied by ${stall.horseName ?? 'a horse'}. This will clear that assignment.`}
        confirmLabel={unassign.isPending ? 'Unassigning…' : 'Unassign'}
        destructive
        pending={unassign.isPending}
        onConfirm={() => {
          unassign.mutate(
            { showId, stableId, stallId: stall.id },
            {
              onSuccess: () => {
                setConfirmUnassign(false);
              },
            },
          );
        }}
      />

      <TargetStallPickerDialog
        open={movePicker}
        onOpenChange={setMovePicker}
        title="Move this horse to…"
        options={moveOptions}
        pending={reassign.isPending}
        onSubmit={(target) => {
          reassign.mutate(
            {
              showId,
              fromStableId: stableId,
              fromStallId: stall.id,
              toStableId: target.stableId,
              toStallId: target.stallId,
            },
            {
              onSuccess: () => {
                setMovePicker(false);
              },
            },
          );
        }}
      />

      <TargetStallPickerDialog
        open={swapPicker}
        onOpenChange={setSwapPicker}
        title="Swap this stall with…"
        options={swapOptions}
        pending={swap.isPending}
        onSubmit={(target) => {
          swap.mutate(
            {
              showId,
              stableAId: stableId,
              stallAId: stall.id,
              stableBId: target.stableId,
              stallBId: target.stallId,
            },
            {
              onSuccess: () => {
                setSwapPicker(false);
              },
            },
          );
        }}
      />

      <ConfirmDialog
        open={confirmClearFor !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmClearFor(null);
        }}
        title={confirmClearFor ? `Set to ${STALL_STATUS_LABELS[confirmClearFor]}?` : ''}
        description={`It is occupied by ${stall.horseName ?? 'a horse'}. Changing its status will clear that assignment.`}
        confirmLabel={setStatus.isPending ? 'Saving…' : 'Continue'}
        destructive
        pending={setStatus.isPending}
        onConfirm={() => {
          if (confirmClearFor) {
            setStatus.mutate(
              { showId, stableId, stallId: stall.id, status: confirmClearFor },
              {
                onSuccess: () => {
                  setConfirmClearFor(null);
                },
              },
            );
          }
        }}
      />
    </div>
  );
}
