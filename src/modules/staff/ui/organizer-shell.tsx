'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOutIcon, SmartphoneIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { ORGANIZER_NAV, ROLE_NAV } from '../constants';
import { NavIcon } from '@/shared/ui/nav-icon';
import { RoleIcon } from '@/shared/ui/role-icon';
import { Tip } from '@/shared/ui/tip';
import { ImpersonationBanner } from './impersonation-banner';
import { useSignOut } from '@/modules/auth/hooks/use-auth-mutations';
import type { StaffProfile } from '@/modules/auth/data/queries';
import {
  RIDER_WORKSPACE,
  ROLE_RAIL_ORDER,
  ROLE_WORKSPACES,
  type RoleWorkspace,
} from '@/shared/constants/role-workspaces';

export function OrganizerShell({
  children,
  profile,
  workspace,
  impersonating = false,
}: {
  children: ReactNode;
  profile: StaffProfile;
  workspace: RoleWorkspace;
  impersonating?: boolean;
}) {
  const pathname = usePathname();
  const { mutate: signOut, isPending: isSigningOut } = useSignOut();
  const [mobilePreview, setMobilePreview] = useState(false);

  /**
   * The role rail is a switcher only for SuperAdmin.
   *
   * In the legacy app this rail lived in platform.html — the demo shell whose
   * whole purpose was showcasing every role, so every icon was clickable there.
   * Carrying that into the real app would be a privilege-escalation control: a
   * Judge could click through to the SuperAdmin console.
   *
   * SuperAdmin is the exception because impersonation is a genuine capability
   * for them, not an oversight — api/_lib/authz.js states SuperAdmin "can touch
   * anything (kept as a real support/impersonation capability, not a bug)", and
   * the legacy SuperAdmin console had an explicit "experience as" feature built
   * on it. Everyone else sees only their own role.
   */
  const isSuperAdmin = profile.platform_role === 'SuperAdmin';

  /**
   * Rider is on the rail but is not a platform_role — riders live in a separate
   * identity table — so it resolves against RIDER_WORKSPACE rather than the
   * role map. The legacy rail showed all nine destinations including Rider, and
   * this keeps that order.
   */
  const workspaceFor = (role: string): RoleWorkspace | undefined =>
    role === 'Rider' ? RIDER_WORKSPACE : ROLE_WORKSPACES[role];

  const railRoles = isSuperAdmin
    ? ROLE_RAIL_ORDER.filter((role) => workspaceFor(role) !== undefined)
    : ROLE_RAIL_ORDER.filter((role) => role === profile.platform_role);

  // A SuperAdmin impersonating an organizer needs the organizer nav, not their
  // own — impersonating is about seeing what the organizer sees.
  const role = impersonating ? 'Organizer' : (profile.platform_role ?? 'Organizer');
  const navItems = ROLE_NAV[role] ?? ORGANIZER_NAV;

  // An exact href match always wins over a prefix match — needed now that some
  // roles (Judge/Scribe) nest sibling routes under their landing tab's own path
  // (`/dashboard/judging` vs. `/dashboard/judging/documents`), which would
  // otherwise light up both at once under plain prefix matching.
  const activeNavItem = navItems.find((n) => n.href === pathname);

  const shell = (
    <div className={cn('dash', mobilePreview && 'dash-mobile-frame')}>
      <aside className="dash-rail">
        <div className="dash-rail-logo">
          F<b>&amp;</b>A
        </div>
        <div className="dash-rail-label">{isSuperAdmin ? 'ROLES' : 'ROLE'}</div>
        {railRoles.map((role) => {
          const target = workspaceFor(role);
          if (!target) return null;
          const active = role === profile.platform_role;
          const label = target.status === 'pending' ? `${target.title} (not migrated)` : target.title;

          // Non-SuperAdmin sees only their own role, so there is nowhere to
          // navigate — render it as a static indicator rather than a dead link.
          if (!isSuperAdmin) {
            return (
              <Tip key={role} text={target.title} className="grid place-items-center">
                <span className="dash-rail-btn active" aria-label={target.title}>
                  <RoleIcon role={role} size={20} />
                </span>
              </Tip>
            );
          }

          return (
            <Tip key={role} text={label} className="grid place-items-center">
              <Link
                href={target.href}
                className={`dash-rail-btn${active ? ' active' : ''}`}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
              >
                <RoleIcon role={role} size={20} />
              </Link>
            </Tip>
          );
        })}
      </aside>

      <aside className="dash-side">
        <div className="dash-side-brand">
          Field <b>&amp;</b> Arena
        </div>
        <div className="dash-side-sub">{workspace.title.toUpperCase()}</div>

        {/*
          "Viewing as" existed in the legacy showstaff.html because Organizer and
          Show Admin shared one view, with money hidden for Show Admin. It is only
          meaningful for someone who can actually be both, so it is not rendered
          for a real Show Admin — offering them an "Organizer" option would imply
          they can grant themselves financial visibility, which the permission
          model deliberately withholds.
        */}
        {profile.platform_role === 'Organizer' && (
          <>
            <div className="dash-side-heading">VIEWING AS</div>
            <Tip text="Preview as Organizer (full access) or ShowAdmin (financials hidden)" className="block w-full">
              <select className="dash-select" defaultValue="organizer" aria-label="Viewing as role">
                <option value="organizer">Organizer</option>
                <option value="showadmin">Show Admin</option>
              </select>
            </Tip>
          </>
        )}

        {/*
          Navigation follows the role, not the shell. Organizer and Show Admin
          share the full organizer nav; the per-show roles each get the sections
          their own legacy view had, so a Judge is not shown Billing and
          MemberDatabase links they cannot use.
        */}
        <nav className="dash-nav" aria-label={`${workspace.title} navigation`}>
          {navItems.map((item) => {
            const active = activeNavItem
              ? item.key === activeNavItem.key
              : pathname.startsWith(`${item.href}/`);
            return (
              <Tip key={item.key} text={item.tip} className="block w-full">
                <Link href={item.href} className={`dash-nav-item${active ? ' active' : ''}`}>
                  <NavIcon name={item.icon} />
                  <span>{item.label}</span>
                </Link>
              </Tip>
            );
          })}
        </nav>

        <div className="dash-side-foot">
          Signed in as
          <b>{profile.name}</b>
          <button
            type="button"
            onClick={() => {
              signOut();
            }}
            disabled={isSigningOut}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <LogOutIcon className="size-3.5" aria-hidden />
            {isSigningOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </aside>

      <div className="dash-main">
        {/*
          An impersonation banner that is impossible to miss. Someone acting on a
          customer's live data while believing it is their own is exactly how a
          support session turns into an incident, so this is a full-width bar with
          a permanent exit, not a subtle badge.
        */}
        {impersonating && <ImpersonationBanner />}

        <header className="dash-topbar">
          <span className="dash-topbar-title">{workspace.title}</span>
          <span className="dash-badge">{profile.platform_role ?? 'Staff'}</span>
          <span className="dash-topbar-note">{workspace.hint}</span>
        </header>
        <main className="dash-content">{children}</main>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMobilePreview((v) => !v);
        }}
        className="dash-mobile-toggle"
      >
        <SmartphoneIcon size={14} aria-hidden />
        {mobilePreview ? 'Exit mobile preview' : 'Mobile preview'}
      </button>
      {mobilePreview ? <div className="dash-mobile-frame-bg">{shell}</div> : shell}
    </>
  );
}
