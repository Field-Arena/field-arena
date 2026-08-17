'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui/shadcn/dialog';
import { PrimaryButton, GhostButton } from '@/shared/ui/organizer/buttons';
import { useSetClassPanel } from '../hooks/use-panel-mutations';

export interface PanelClass {
  id: string;
  label: string;
  location: string | null;
}
export interface PanelStaff {
  id: string;
  name: string;
}

const LABEL = 'mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-[#6E7C76]';
const SELECT =
  'w-full appearance-none rounded-[8px] border border-[#C6CFCB] bg-white px-3 py-2.5 text-[14px] font-medium text-ink-deep outline-none focus-visible:border-gold';

/**
 * Setup → Venue "Assign Judges" — pick a head judge and scribe for a ring and
 * the classes they officiate. Writes the J1 panel seat (useSetClassPanel), which
 * is what a Judge/Scribe's My Assignments reads. Opened per ring from VenueCard.
 *
 * The form lives in its own component, mounted only while the dialog is open and
 * keyed by ring, so its initial selection comes straight from useState
 * initializers — no reset-in-effect needed.
 */
export function AssignJudgesDialog({
  open,
  onOpenChange,
  ringName,
  classes,
  judges,
  scribes,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  ringName: string;
  classes: PanelClass[];
  judges: PanelStaff[];
  scribes: PanelStaff[];
}) {
  const noStaff = judges.length === 0 && scribes.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Assign judges — {ringName}</DialogTitle>
          <DialogDescription>
            Pick who officiates, then the classes they cover. They appear on the judge or scribe’s My
            Assignments once saved.
          </DialogDescription>
        </DialogHeader>

        {classes.length === 0 ? (
          <p className="py-6 text-center text-[14px] text-[#7A8781]">
            No classes yet — add some in Select Events first, then assign a panel.
          </p>
        ) : noStaff ? (
          <p className="py-6 text-center text-[14px] text-[#7A8781]">
            No judges or scribes on this show yet — add them under Users first.
          </p>
        ) : (
          <PanelForm
            key={ringName}
            ringName={ringName}
            classes={classes}
            judges={judges}
            scribes={scribes}
            onClose={() => {
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PanelForm({
  ringName,
  classes,
  judges,
  scribes,
  onClose,
}: {
  ringName: string;
  classes: PanelClass[];
  judges: PanelStaff[];
  scribes: PanelStaff[];
  onClose: () => void;
}) {
  const setPanel = useSetClassPanel();
  const [judgeId, setJudgeId] = useState('');
  const [scribeId, setScribeId] = useState('');
  const [checked, setChecked] = useState<Set<string>>(() => {
    // Default to this ring's own classes; if none carry that ring (location is
    // optional per class), start with all classes so the panel is still usable.
    const inRing = classes.filter((c) => c.location === ringName).map((c) => c.id);
    return new Set(inRing.length ? inRing : classes.map((c) => c.id));
  });

  const allChecked = checked.size === classes.length;
  const canSave = checked.size > 0 && (judgeId !== '' || scribeId !== '') && !setPanel.isPending;

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function save() {
    setPanel.mutate(
      { classIds: [...checked], judgeStaffId: judgeId || null, scribeStaffId: scribeId || null },
      {
        onSuccess: () => {
          toast.success('Panel saved — it now shows on the judge/scribe’s My Assignments.');
          onClose();
        },
      },
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={LABEL}>Judge</span>
          <select
            className={SELECT}
            value={judgeId}
            onChange={(e) => {
              setJudgeId(e.target.value);
            }}
          >
            <option value="">— none —</option>
            {judges.map((j) => (
              <option key={j.id} value={j.id}>
                {j.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={LABEL}>Scribe</span>
          <select
            className={SELECT}
            value={scribeId}
            onChange={(e) => {
              setScribeId(e.target.value);
            }}
          >
            <option value="">— none —</option>
            {scribes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className={LABEL + ' mb-0'}>Classes ({checked.size} selected)</span>
          <button
            type="button"
            onClick={() => {
              setChecked(allChecked ? new Set() : new Set(classes.map((c) => c.id)));
            }}
            className="hover:text-gold text-[12px] font-semibold text-forest"
          >
            {allChecked ? 'Clear all' : 'Select all'}
          </button>
        </div>
        <div className="max-h-[220px] overflow-y-auto rounded-[10px] border border-[#E4E8E5]">
          {classes.map((c) => (
            <label
              key={c.id}
              className="flex items-center gap-2.5 border-b border-[#EEF2F0] px-3 py-2 text-[13.5px] last:border-b-0 hover:bg-[#FAFBFA]"
            >
              <input
                type="checkbox"
                checked={checked.has(c.id)}
                onChange={() => {
                  toggle(c.id);
                }}
                className="size-[17px] accent-[#22503c]"
              />
              <span className="text-ink-deep">{c.label}</span>
              {c.location ? (
                <span className="ml-auto text-[12px] text-[#7A8781]">{c.location}</span>
              ) : null}
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2.5 pt-1">
        <GhostButton type="button" onClick={onClose}>
          Cancel
        </GhostButton>
        <PrimaryButton type="button" disabled={!canSave} onClick={save}>
          {setPanel.isPending ? 'Saving…' : 'Assign panel'}
        </PrimaryButton>
      </div>
    </div>
  );
}
