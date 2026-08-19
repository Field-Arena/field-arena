'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui/shadcn/dialog';
import { PanelForm } from '@/modules/judging/ui/panel-form';

export interface PanelClass {
  id: string;
  label: string;
  location: string | null;
}
export interface PanelStaff {
  id: string;
  name: string;
}

/**
 * Setup → Venue "Assign Judges" — pick a head judge and scribe for a ring and
 * the classes they officiate. Writes the J1 panel seat (useSetClassPanel), which
 * is what a Judge/Scribe's My Assignments reads. Opened per ring from VenueCard.
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
