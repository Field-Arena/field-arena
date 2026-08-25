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

            const next = typeof raw === 'string' ? raw.trim() : '';

            if (!next) {
              onOpenChange(false);
              return;
            }
            onSubmit(next);
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-hunter-deep font-serif text-xl">{title}</DialogTitle>
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
