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
import { StatusBadge, type StatusTone } from '@/shared/ui/status-badge';
import type { PlatformAccount } from '../data/queries';
import { useRemoveSuperAdmin } from '../hooks/use-superadmin-user-mutations';
import { AddSuperAdminDialog } from './add-super-admin-dialog';

/** Role → badge tone. SuperAdmin reads as the privileged role; Organizer as the customer. */
const ROLE_TONE: Record<string, StatusTone> = {
  SuperAdmin: 'info',
  Organizer: 'success',
};

function roleLabel(role: string | null): string {
  if (!role) return 'Unassigned';
  // 'ShowAdmin' → 'Show Admin', leave the rest as stored.
  return role === 'ShowAdmin' ? 'Show Admin' : role;
}

/**
 * The first Users tab: every staff-side login on the platform. Super Admins can
 * be added here and removed inline; other roles are listed read-only (they are
 * managed from the Organizer staff directory or the Organizers page).
 *
 * Data arrives as props from the server component — this stays presentational
 * beyond the local open/closed state the confirm dialog needs.
 */
export function SuperAdminsPanel({
  accounts,
  currentUserId,
}: {
  accounts: PlatformAccount[];
  currentUserId: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <AddSuperAdminDialog />
        <span className="max-w-[560px] text-[13px] leading-relaxed text-fa-muted">
          Every Super Admin has identical full access — impersonate any organizer,
          suspend/reactivate accounts, everything.
        </span>
      </div>

      {accounts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-white px-5 py-8 text-center text-sm text-fa-muted">
          No accounts yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full border-collapse text-[13.5px]">
            <caption className="sr-only">Every platform account</caption>
            <thead>
              <tr className="bg-hunter-pale">
                {['Name', 'Email', 'Role', 'Status', ''].map((heading, i) => (
                  <th
                    key={heading || `actions-${String(i)}`}
                    scope="col"
                    className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-fa-muted last:text-right"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="border-b border-border last:border-b-0">
                  <td className="px-3 py-2.5 font-semibold text-hunter-deep">{account.name}</td>
                  <td className="px-3 py-2.5 text-fa-muted">{account.email}</td>
                  <td className="px-3 py-2.5">
                    <StatusBadge tone={account.role ? (ROLE_TONE[account.role] ?? 'neutral') : 'neutral'}>
                      {roleLabel(account.role)}
                    </StatusBadge>
                  </td>
                  <td className="px-3 py-2.5">
                    {account.status === 'active' ? (
                      <StatusBadge tone="success">Active</StatusBadge>
                    ) : (
                      <StatusBadge tone="warn">Invite pending</StatusBadge>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {account.role === 'SuperAdmin' ? (
                      <RemoveSuperAdminAction
                        account={account}
                        isSelf={account.id === currentUserId}
                      />
                    ) : (
                      <span className="pr-1 text-[12px] text-fa-muted-2">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/**
 * Remove (active) or Cancel invite (pending) — Super Admins only. Both delete the
 * account; the copy differs because cancelling an unaccepted invite is a lighter
 * act than removing someone already working. The signed-in Super Admin cannot
 * remove themselves, so their own row shows a disabled "You" marker instead.
 */
function RemoveSuperAdminAction({
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
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
        className="rounded-lg border border-status-danger px-3 py-1.5 text-[12.5px] font-bold text-status-danger transition-colors hover:bg-status-danger-bg"
      >
        {pending ? 'Cancel invite' : 'Remove'}
      </button>

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
