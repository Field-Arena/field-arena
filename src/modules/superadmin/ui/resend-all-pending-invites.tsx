'use client';

import { useState } from 'react';
import { Loader2Icon, MailIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog';
import { Button } from '@/shared/ui/shadcn/button';
import { useResendAllPendingInvites } from '@/modules/superadmin/hooks/use-organization-mutations';

export function ResendAllPendingInvites({ pendingCount }: { pendingCount: number }) {
  const [open, setOpen] = useState(false);
  const resendAll = useResendAllPendingInvites({
    onSuccess: () => {
      setOpen(false);
    },
  });

  if (pendingCount === 0) return null;

  const plural = pendingCount === 1 ? '' : 's';

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        title="Send a fresh Organizer invite email to every organizer still pending onboarding"
        onClick={() => {
          setOpen(true);
        }}
        className="border-line-strong text-forest hover:border-gold inline-flex h-8 items-center gap-2 rounded-full border bg-white px-3.5 text-[12.5px] font-semibold transition-colors hover:bg-[#FFFCF2]"
      >
        <MailIcon className="size-[14px]" aria-hidden />
        Resend invite (all pending)
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-hunter-deep font-serif text-xl">
              Resend {pendingCount} pending invite{plural}?
            </DialogTitle>
            <DialogDescription className="leading-relaxed">
              Every organizer who hasn&apos;t finished setting up their account gets a fresh invite
              email. They are sent one at a time, so a slow provider can&apos;t drop any of them —
              this may take a moment.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={resendAll.isPending}
              onClick={() => {
                resendAll.mutate();
              }}
            >
              {resendAll.isPending && <Loader2Icon className="animate-spin" aria-hidden />}
              {resendAll.isPending ? 'Sending…' : `Send ${String(pendingCount)} invite${plural}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
