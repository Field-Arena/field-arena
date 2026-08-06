'use client';

import { useTransition } from 'react';
import { RIDER_WORKSPACE, ROLE_RAIL_ORDER, ROLE_WORKSPACES } from '@/shared/constants/role-workspaces';
import { RoleIcon } from '@/shared/ui/role-icon';
import { Tip } from '@/shared/ui/tip';
import { cn } from '@/shared/lib/utils';
import { setRailRole } from '@/shared/lib/rail-role';

/**
 * The dark role rail down the left edge, used by the SuperAdmin console.
 *
 * Icons are the verbatim legacy glyphs (see RoleIcon), in the legacy order,
 * including Rider — which is on the rail despite not being a platform_role, so
 * it resolves against RIDER_WORKSPACE.
 *
 * Interactive for SuperAdmin only. In the legacy app the rail lived in
 * platform.html — the demo shell built to showcase every role — so every icon
 * was clickable. Carrying that into the real app would be a
 * privilege-escalation control: a Judge could click into the SuperAdmin console.
 * SuperAdmin keeps it because api/_lib/authz.js documents their reach as "a real
 * support/impersonation capability, not a bug".
 */
export function RoleRail({
  currentRole,
  activeRole,
  variant = 'default',
}: {
  currentRole: string | null;
  /**
   * Which icon is highlighted — defaults to `currentRole` when omitted (the
   * organizer workspace's own single-icon rail, where there is only ever one
   * role to show). SuperAdmin's console passes its own tracked selection
   * (`shared/lib/rail-role.ts`) instead: two pairs of roles here share one
   * workspace href — Organizer/Show Admin both `/dashboard`, Judge/Scribe
   * both `/dashboard/judging` — so the current URL alone can't say which
   * icon should light up.
   */
  activeRole?: string | null;
  /**
   * 'console' matches the Admin Console design: wider, darker, larger targets,
   * and no F&A mark — the console's own sidebar carries the brand right beside
   * it, so repeating it here reads as two logos. Opt-in so the organizer
   * workspace, which shares this component, keeps its existing rail.
   */
  variant?: 'default' | 'console';
}) {
  const isSuperAdmin = currentRole === 'SuperAdmin';
  const isConsole = variant === 'console';
  const [isPending, startTransition] = useTransition();
  const highlighted = activeRole ?? currentRole;

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
          ? 'sticky top-0 h-dvh w-[74px] gap-1.5 border-r border-[rgba(255,255,255,.07)] bg-[#08201A] pb-[18px] pt-5'
          : 'w-[54px] gap-1.5 bg-hunter-deep py-3.5'
      )}
    >
      {!isConsole && (
        <div className="font-serif text-sm font-bold leading-none text-white">
          F<span className="text-gold">&amp;</span>A
        </div>
      )}
      <div
        className={cn(
          isConsole
            ? 'mb-2.5 text-[8.5px] font-bold uppercase tracking-[.16em] text-[rgba(251,250,247,.34)]'
            : 'mb-3 text-[8px] tracking-[0.12em] text-[#7f8f84]'
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
          isPending && 'opacity-70'
        );

        /*
          The styled tooltip rather than a native `title`. The rail is icons only
          — there is no visible label at any width — so this is how a role is
          identified, and the legacy rail worked the same way through data-tip.
        */
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
                startTransition(async () => {
                  await setRailRole(role);
                });
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
    </aside>
  );
}
