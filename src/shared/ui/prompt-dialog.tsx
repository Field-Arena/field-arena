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
import { Input } from '@/shared/ui/shadcn/input';

/**
 * A styled stand-in for `window.prompt()` — the companion to ConfirmDialog.
 *
 * Same shape as the native prompt (a question, one text field, Cancel/OK) but
 * in this app's own chrome, so a rename does not hand the user a browser dialog
 * that announces "localhost:3000 says" and cannot be styled.
 *
 * The field is uncontrolled and the form is keyed on what it opened with, so
 * renaming a second row remounts it with that row's text rather than carrying
 * the first row's — no effect syncing a prop into state.
 */
export function PromptDialog({
  open,
  onOpenChange,
  title,
  description,
  label,
  defaultValue,
  placeholder,
  confirmLabel = 'Save',
  pending = false,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  label: string;
  defaultValue: string;
  placeholder?: string;
  confirmLabel?: string;
  pending?: boolean;
  onSubmit: (value: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <form
          key={defaultValue}
          onSubmit={(event) => {
            event.preventDefault();
            const raw = new FormData(event.currentTarget).get('prompt-value');
            // FormData can hand back a File; only a text answer means anything here.
            const next = typeof raw === 'string' ? raw.trim() : '';
            // An empty answer means "leave it alone", the same as cancelling —
            // never a rename to nothing.
            if (!next) {
              onOpenChange(false);
              return;
            }
            onSubmit(next);
          }}
        >
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-hunter-deep">{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>

          <div className="my-4">
            <label htmlFor="prompt-value" className="mb-1.5 block text-[13px] font-semibold">
              {label}
            </label>
            <Input
              id="prompt-value"
              name="prompt-value"
              autoFocus
              defaultValue={defaultValue}
              placeholder={placeholder}
              disabled={pending}
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
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
