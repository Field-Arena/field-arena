'use client';

import { useCallback, useState } from 'react';
import {
  RIDER_WORKSPACE,
  ROLE_RAIL_ORDER,
  ROLE_WORKSPACES,
} from '@/shared/constants/role-workspaces';
import { RoleIcon } from '@/shared/ui/role-icon';
import { useSetRailRole } from '../hooks/use-session-mutations';
import { useDismiss } from '@/shared/hooks/use-dismiss';
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
 * workspace. Switching into one confirms first (legacy WRITE_ACCESS_ROLES);
 * read-only views like Announcer stay one click. */
const WRITE_ACCESS_ROLES = new Set(['Organizer', 'ShowAdmin', 'Judge', 'Scribe']);

const workspaceFor = (role: string) => (role === 'Rider' ? RIDER_WORKSPACE : ROLE_WORKSPACES[role]);

/** The redesign's topbar "View as" switcher — the SuperAdmin role rail folded
 * into one menu. Same behavior: picks set the rail-role cookie. */
export function ViewAsMenu({ activeRole }: { activeRole: string }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const { isPending, setRole } = useSetRailRole();
  const close = useCallback(() => {
    setOpen(false);
  }, []);
  const ref = useDismiss<HTMLDivElement>(open, close);

  const roles = ROLE_RAIL_ORDER.filter((role) => workspaceFor(role) !== undefined);
  const activeLabel =
    activeRole === 'SuperAdmin' ? 'Super Admin' : (workspaceFor(activeRole)?.title ?? activeRole);

  function switchTo(role: string) {
    setRole(role);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="fa-viewas"
        disabled={isPending}
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
        }}
      >
        <span className="fa-lbl">View as</span>
        <span className="fa-role">
          <span className="fa-rdot" />
          {activeLabel.replace(' Workspace', '').replace(' Console', '')}
        </span>
        <svg
          className="fa-cv"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="fa-viewas-menu fa-open">
          <div className="fa-mhd">See the platform as</div>
          {roles.map((role) => {
            const target = workspaceFor(role);
            if (!target) return null;
            const current = role === activeRole;
            return (
              <button
                key={role}
                type="button"
                disabled={isPending}
                className={`fa-mi w-full border-0 text-left ${current ? 'fa-sel' : 'bg-transparent'}`}
                onClick={() => {
                  setOpen(false);
                  if (current) return;
                  if (WRITE_ACCESS_ROLES.has(role)) setConfirming(role);
                  else switchTo(role);
                }}
              >
                <RoleIcon role={role} size={16} />
                <span className="flex-1">
                  {target.status === 'pending' ? `${target.title} (not migrated)` : target.title}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <Dialog
        open={confirming !== null}
        onOpenChange={(next) => {
          if (!next) setConfirming(null);
        }}
      >
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="text-lg">
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
    </div>
  );
}
