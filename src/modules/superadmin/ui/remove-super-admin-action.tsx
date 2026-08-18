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

/**
 * Remove (active) or Cancel invite (pending) — Super Admins only. Both delete the
 * account; the copy differs because cancelling an unaccepted invite is a lighter
 * act than removing someone already working. The signed-in Super Admin cannot
 * remove themselves, so their own row shows a disabled "You" marker instead.
 */
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
    return <span className="pr-1 text-[12px] font-semibold text-fa-muted-2">You</span>;
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
        className="h-auto rounded-lg border border-status-danger px-3 py-1.5 text-[12.5px] font-bold text-status-danger hover:bg-status-danger-bg transition-colors"
      >
        {pending ? 'Cancel invite' : 'Remove'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-hunter-deep">
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
