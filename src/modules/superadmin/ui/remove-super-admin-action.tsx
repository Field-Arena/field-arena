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
import type { PlatformAccount } from '@/modules/superadmin/types';
import { useRemoveSuperAdmin } from '@/modules/superadmin/hooks/use-superadmin-user-mutations';

export function RemoveSuperAdminAction({
  account,
  isSelf,
}: {
  account: PlatformAccount;
  isSelf: boolean;
}) {
  const [open, setOpen] = useState(false);
  const remove = useRemoveSuperAdmin({
    onSuccess: () => {
      setOpen(false);
    },
  });

  if (isSelf) {
    return <span className="pr-1 text-[12px] font-semibold text-[#8A94A3]">You</span>;
  }

  const pending = account.status === 'pending';

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          setOpen(true);
        }}
        className="fa-act fa-danger h-auto"
      >
        {pending ? 'Cancel invite' : 'Remove'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-[#101828]">
              {pending ? 'Cancel this invite?' : `Remove ${account.name} as a Super Admin?`}
            </DialogTitle>
            <DialogDescription className="leading-relaxed">
              {pending
                ? `The pending invite to ${account.email} will be cancelled and the account removed. They can be invited again later.`
                : "This deletes their account entirely — they'll need a brand-new invite to come back."}
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
              Keep
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => {
                remove.mutate(account.id);
              }}
            >
              {remove.isPending && <Loader2Icon className="animate-spin" aria-hidden />}
              {remove.isPending
                ? pending
                  ? 'Cancelling…'
                  : 'Removing…'
                : pending
                  ? 'Cancel invite'
                  : 'Remove Super Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
