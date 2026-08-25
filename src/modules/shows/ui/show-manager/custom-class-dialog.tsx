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
import { cn } from '@/shared/lib/utils';
import { DEFAULT_CLASS_FEE } from '@/modules/shows/constants';
import type { SelectEventsData } from '@/modules/shows/data/setup-queries';
import { useAddCustomClass } from '@/modules/shows/hooks/use-select-events-mutations';
import {
  SM_LABEL,
  SM_INPUT,
  SM_SELECT,
  SM_GREEN_BTN,
  SM_GHOST_BTN,
} from '@/modules/shows/ui/show-manager/tokens';

export function CustomClassDialog({
  data,
  onClose,
}: {
  data: SelectEventsData;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [division, setDivision] = useState('');
  const [fee, setFee] = useState(String(DEFAULT_CLASS_FEE));
  const [sponsor, setSponsor] = useState('');

  const add = useAddCustomClass({ onSuccess: onClose });
  const divisions = [
    ...new Set(data.classes.map((c) => c.division).filter((d): d is string => !!d)),
  ];

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add Custom Class</DialogTitle>
          <DialogDescription>
            A one-off class of your own — it scores and places like any other.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="cc-name" className={SM_LABEL}>
              Class name
            </Label>
            <Input
              id="cc-name"
              className={cn('h-auto', SM_INPUT)}
              placeholder="e.g. Sponsor Exhibition Class"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
            />
          </div>

          <div>
            <Label htmlFor="cc-division" className={SM_LABEL}>
              Division (optional)
            </Label>
            <select
              id="cc-division"
              className={SM_SELECT}
              value={division}
              onChange={(e) => {
                setDivision(e.target.value);
              }}
            >
              <option value="">—</option>
              {divisions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="cc-fee" className={SM_LABEL}>
              Entry fee
            </Label>
            <Input
              id="cc-fee"
              type="number"
              min={0}
              className={cn('h-auto', SM_INPUT)}
              value={fee}
              onChange={(e) => {
                setFee(e.target.value);
              }}
            />
          </div>

          <div>
            <Label htmlFor="cc-sponsor" className={SM_LABEL}>
              Sponsor (optional)
            </Label>
            <Input
              id="cc-sponsor"
              className={cn('h-auto', SM_INPUT)}
              placeholder="e.g. Presented by Willowbrook Farm"
              value={sponsor}
              onChange={(e) => {
                setSponsor(e.target.value);
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            className={cn('h-auto', SM_GHOST_BTN, 'hover:bg-white')}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={cn('h-auto', SM_GREEN_BTN)}
            disabled={add.isPending || name.trim().length < 2}
            onClick={() => {
              add.mutate({ showId: data.showId, name, division, fee, sponsor });
            }}
          >
            {add.isPending && <Loader2Icon className="size-4 animate-spin" aria-hidden />}
            Add Class
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
