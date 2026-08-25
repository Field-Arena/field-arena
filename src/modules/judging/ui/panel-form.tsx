'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { PrimaryButton, GhostButton } from '@/shared/ui/organizer/buttons';
import { Button } from '@/shared/ui/shadcn/button';
import { useSetClassPanel } from '@/modules/judging/hooks/use-panel-mutations';
import type { PanelClass, PanelStaff } from '@/modules/judging/ui/assign-judges-dialog';

const LABEL = 'mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-[#6E7C76]';
const SELECT =
  'w-full appearance-none rounded-[8px] border border-[#C6CFCB] bg-white px-3 py-2.5 text-[14px] font-medium text-ink-deep outline-none focus-visible:border-gold';

export function PanelForm({
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
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setChecked(allChecked ? new Set() : new Set(classes.map((c) => c.id)));
            }}
            className="text-forest hover:text-gold h-auto bg-transparent px-0 py-0 text-[12px] font-semibold hover:bg-transparent active:translate-y-0"
          >
            {allChecked ? 'Clear all' : 'Select all'}
          </Button>
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
