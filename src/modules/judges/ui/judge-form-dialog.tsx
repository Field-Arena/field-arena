'use client';

import { useState } from 'react';
import { Loader2Icon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { useCreateJudge, useUpdateJudge } from '@/modules/judges/hooks/use-judge-mutations';
import { usefIdSchema } from '@/modules/judges/schemas';
import { formatChangedAt, usefIdSourceInfo } from '@/modules/judges/utils/judge-display';
import type { JudgeListItem } from '@/modules/judges/types';
import { Pill } from '@/shared/ui/organizer/fa-page';

/* Add a judge (judge = null) or edit one. The body remounts on every open, so
 * the fields always start from the judge being edited. */
export function JudgeFormDialog({
  open,
  judge,
  onClose,
}: {
  open: boolean;
  judge: JudgeListItem | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[520px]">
        {open && <JudgeFormBody key={judge?.id ?? 'new'} judge={judge} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function JudgeFormBody({ judge, onClose }: { judge: JudgeListItem | null; onClose: () => void }) {
  const [firstName, setFirstName] = useState(judge?.firstName ?? '');
  const [lastName, setLastName] = useState(judge?.lastName ?? '');
  const [email, setEmail] = useState(judge?.email ?? '');
  const [phone, setPhone] = useState(judge?.phone ?? '');
  const [usefId, setUsefId] = useState(judge?.usefId ?? '');
  const [error, setError] = useState<string | null>(null);

  const create = useCreateJudge({ onSuccess: onClose });
  const update = useUpdateJudge({ onSuccess: onClose });
  const pending = create.isPending || update.isPending;

  const usefIdProblem = usefIdSchema.safeParse(usefId).success ? null : 'A USEF ID is numbers only';
  const source = judge ? usefIdSourceInfo(judge) : null;
  const changedAt = judge ? formatChangedAt(judge.usefIdUpdatedAt) : null;

  function save() {
    if (!firstName.trim() || !lastName.trim()) {
      setError('Enter a first and last name.');
      return;
    }
    if (!email.trim()) {
      setError('Enter an email. It is how the judge is invited to a show.');
      return;
    }
    if (usefIdProblem) {
      setError(usefIdProblem);
      return;
    }
    setError(null);
    const values = { firstName, lastName, email, phone, usefId };
    if (judge) update.mutate({ id: judge.id, ...values });
    else create.mutate(values);
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-[family-name:var(--ws-fraunces)] text-2xl font-bold text-[#0D2C23]">
          {judge ? 'Edit judge' : 'Add a judge'}
        </DialogTitle>
        <DialogDescription>
          {judge
            ? 'Changes here apply the next time this judge is added to a show.'
            : 'Add a judge once, then bring them into any show from Users.'}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="jf-first">First name</Label>
            <Input
              id="jf-first"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="jf-last">Last name</Label>
            <Input
              id="jf-last"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
              }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="jf-email">Email</Label>
            <Input
              id="jf-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="jf-phone">Phone (optional)</Label>
            <Input
              id="jf-phone"
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
              }}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Label htmlFor="jf-usef">USEF ID</Label>
            {source && <Pill tone={source.tone}>{source.label}</Pill>}
          </div>
          <Input
            id="jf-usef"
            inputMode="numeric"
            placeholder="Numbers only. Leave blank if not known yet."
            value={usefId}
            onChange={(e) => {
              setUsefId(e.target.value);
            }}
          />
          {usefIdProblem && (
            <p role="alert" className="text-status-danger text-[13px]">
              {usefIdProblem}
            </p>
          )}
          {changedAt && (
            <p className="text-[12.5px] font-semibold text-[#5A6B63]">Last changed {changedAt}.</p>
          )}
        </div>
        {error && (
          <p role="alert" className="text-status-danger text-[13px]">
            {error}
          </p>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" disabled={pending} onClick={save}>
          {pending && <Loader2Icon className="size-4 animate-spin" aria-hidden />}
          {judge ? 'Save' : 'Add judge'}
        </Button>
      </DialogFooter>
    </>
  );
}
