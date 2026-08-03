'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog';
import { Button } from '@/shared/ui/shadcn/button';
import { cn } from '@/shared/lib/utils';

/**
 * A styled stand-in for `window.confirm()` — same "are you sure" shape (a
 * title, a description, Cancel/confirm), but rendered in this app's own
 * design system instead of the browser's native dialog chrome.
 *
 * Controlled: the caller owns `open` and decides what happens on confirm —
 * this component only renders the prompt and reports the click.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  pending = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button, for a delete or other irreversible action. */
  destructive?: boolean;
  /** Disables both buttons and swaps the confirm label to a "…ing" form the caller passes in confirmLabel. */
  pending?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-hunter-deep">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => {
              onOpenChange(false);
            }}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className={cn(
              destructive && 'bg-[#B4432F] text-[#FBF7EE] hover:bg-[#98341F]',
              pending && 'opacity-70'
            )}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
