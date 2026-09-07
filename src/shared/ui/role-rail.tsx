'use client';

import { useState, useTransition } from 'react';
import {
  RIDER_WORKSPACE,
  ROLE_RAIL_ORDER,
  ROLE_WORKSPACES,
} from '@/shared/constants/role-workspaces';
import { RoleIcon } from '@/shared/ui/role-icon';
import { Tip } from '@/shared/ui/tip';
import { cn } from '@/shared/lib/utils';
import { setRailRole } from '@/shared/lib/rail-role';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog';
import { Button } from '@/shared/ui/shadcn/button';

/* Roles that carry real write access — live scores, entries, the full org
 * workspace. Legacy WRITE_ACCESS_ROLES: switching into one of these used to
 * happen on the same silent click as picking a read-only view like Announcer,
 * so it now confirms first. Announcer/ShowStaff/Rider stay one click. */
const WRITE_ACCESS_ROLES = new Set(['Organizer', 'ShowAdmin', 'Judge', 'Scribe']);

export function RoleRail({
  currentRole,
  activeRole,
  variant = 'default',
}: {
  currentRole: string | null;

  activeRole?: string | null;

  variant?: 'default' | 'console';
}) {
  const isSuperAdmin = currentRole === 'SuperAdmin';
  const isConsole = variant === 'console';
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<string | null>(null);
  const highlighted = activeRole ?? currentRole;

  function switchTo(role: string) {
    startTransition(async () => {
      await setRailRole(role);
    });
  }

  const workspaceFor = (role: string) =>
    role === 'Rider' ? RIDER_WORKSPACE : ROLE_WORKSPACES[role];

  const roles = isSuperAdmin
    ? ROLE_RAIL_ORDER.filter((role) => workspaceFor(role) !== undefined)
    : ROLE_RAIL_ORDER.filter((role) => role === currentRole);

  return (
    <aside
      className={cn(
        'flex flex-none flex-col items-center',
        isConsole
          ? 'sticky top-0 h-dvh w-[74px] gap-1.5 border-r border-[rgba(255,255,255,.07)] bg-[#08201A] pt-5 pb-[18px]'
          : 'bg-hunter-deep w-[54px] gap-1.5 py-3.5',
      )}
    >
      {!isConsole && (
        <div className="font-serif text-sm leading-none font-bold text-white">
          F<span className="text-gold">&amp;</span>A
        </div>
      )}
      <div
        className={cn(
          isConsole
            ? 'mb-2.5 text-[8.5px] font-bold tracking-[.16em] text-[rgba(251,250,247,.34)] uppercase'
            : 'mb-3 text-[8px] tracking-[0.12em] text-[#7f8f84]',
        )}
      >
        {isSuperAdmin ? 'ROLES' : 'ROLE'}
      </div>

      {roles.map((role) => {
        const target = workspaceFor(role);
        if (!target) return null;
        const active = role === highlighted;
        const label =
          target.status === 'pending' ? `${target.title} — not migrated yet` : target.title;

        const classes = cn(
          'grid place-items-center transition',
          isConsole ? 'size-11 rounded-[10px] border' : 'size-10 rounded-[11px]',
          active
            ? isConsole
              ? 'border-[rgba(201,162,39,.42)] bg-[#17402F] text-gold'
              : 'bg-gold text-hunter-deep'
            : isConsole
              ? 'border-transparent text-[rgba(251,250,247,.5)] hover:bg-[#17402F] hover:text-gold-light'
              : 'text-[#8ba093] hover:bg-white/10 hover:text-[#d7e2da]',
          isPending && 'opacity-70',
        );

        if (!isSuperAdmin) {
          return (
            <Tip key={role} text={target.title} className="grid place-items-center">
              <span className={classes} aria-label={target.title}>
                <RoleIcon role={role} size={20} />
              </span>
            </Tip>
          );
        }

        return (
          <Tip key={role} text={label} className="grid place-items-center">
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                if (active) return;
                if (WRITE_ACCESS_ROLES.has(role)) setConfirming(role);
                else switchTo(role);
              }}
              className={classes}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
            >
              <RoleIcon role={role} size={20} />
            </button>
          </Tip>
        );
      })}

      <Dialog
        open={confirming !== null}
        onOpenChange={(next) => {
          if (!next) setConfirming(null);
        }}
      >
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="text-hunter-deep font-serif text-lg">
              View as {confirming ? (workspaceFor(confirming)?.title ?? confirming) : ''}?
            </DialogTitle>
            <DialogDescription className="leading-relaxed">
              This role can make real changes — scores, entries, or account settings — not just view
              them. Anything you do is recorded against your own account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setConfirming(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={() => {
                const next = confirming;
                setConfirming(null);
                if (next) switchTo(next);
              }}
            >
              {isPending ? 'Switching…' : 'Continue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
