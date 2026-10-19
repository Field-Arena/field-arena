'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog';
import { DangerButton, GhostButton } from '@/shared/ui/organizer/buttons';
import {
  modalBodyClass,
  modalContentClass,
  modalFooterClass,
} from '@/shared/ui/organizer/modal-kit';

/* Asked before the Test Builder throws away an edited draft — switching to
 * another test from the picker, starting a new one, or cancelling. */
export function DiscardDraftDialog({
  open,
  draftName,
  nextLabel,
  onKeepEditing,
  onDiscard,
}: {
  open: boolean;
  draftName: string;
  /** What happens on discard, e.g. `open "Training Level Test 2"`. */
  nextLabel: string;
  onKeepEditing: () => void;
  onDiscard: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onKeepEditing();
      }}
    >
      <DialogContent className={`${modalContentClass} sm:max-w-[460px]`}>
        <div className={modalBodyClass}>
          <DialogHeader>
            <DialogTitle className="text-[17px] font-semibold text-[#101828]">
              Discard unsaved changes?
            </DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed text-[#475467]">
              You have unsaved changes to &ldquo;{draftName.trim() || 'this test'}&rdquo;. If you{' '}
              {nextLabel} now, those changes will be lost.
            </DialogDescription>
          </DialogHeader>
        </div>
        <DialogFooter className={modalFooterClass}>
          <GhostButton onClick={onKeepEditing}>Keep editing</GhostButton>
          <DangerButton onClick={onDiscard}>Discard changes</DangerButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
