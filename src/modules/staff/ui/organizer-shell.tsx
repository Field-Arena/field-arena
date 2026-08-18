'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOutIcon, SmartphoneIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { ORGANIZER_NAV, ROLE_NAV } from '../constants';
import type { MemberOrg } from '../data/org-selection';
import { useOrganizerShellPreview, useOrganizerShellOrgSwitch } from '../hooks/use-organizer-shell-actions';
import { setRailRole } from '@/shared/lib/rail-role';
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
  previewingAsShowAdmin = false,
  railRoleCookie = null,
  selectedOrgId = null,
  memberOrgs = [],
}: {
  children: ReactNode;
  profile: StaffProfile;
  workspace: RoleWorkspace;
  impersonating?: boolean;
  /** An Organizer (or impersonating SuperAdmin) previewing their own workspace as Show Admin — see data/preview-role.ts. */
  previewingAsShowAdmin?: boolean;
  /** Which rail icon was last clicked while impersonating — see shared/lib/rail-role.ts. */
  railRoleCookie?: string | null;
  /** The org the "Organization" switcher below currently points at — see data/org-selection.ts. Null while impersonating. */
  selectedOrgId?: string | null;
  /** Every org this person has real access to. The switcher only renders past one entry — a single-org person has nothing to switch between. */
  memberOrgs?: MemberOrg[];
}) {
  const pathname = usePathname();
  const { mutate: signOut, isPending: isSigningOut } = useSignOut();
  const [mobilePreview, setMobilePreview] = useState(false);
  const {
    isPending: isPreviewPending,
    setPreview,
    runTransition: runPreviewTransition,
  } = useOrganizerShellPreview();
  const { isPending: isOrgPending, setOrg } = useOrganizerShellOrgSwitch();

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

  /**
   * Which role's workspace is actually on screen right now — drives the
   * header title/hint, which rail icon lights up, and which nav the sidebar
   * shows. Derived from the current pathname wherever a role's href is
   * unique; the two ambiguous pairs (Organizer/Show Admin both `/dashboard`,
   * Judge/Scribe both `/dashboard/judging`) fall back to a cookie, since the
   * URL alone can't tell them apart. Previously this whole shell only ever
   * considered Organizer vs. Show Admin — a SuperAdmin who clicked Judge (or
   * any other rail icon) while impersonating got Judge's own content
   * rendered inside a header, rail highlight, and nav that all still read
   * "Organizer"/"Show Admin", because nothing here looked at the actual
   * route being viewed.
   */
  const activeRailRole = (() => {
    if (!isSuperAdmin) return profile.platform_role ?? 'Organizer';
    if (pathname === '/dashboard') return previewingAsShowAdmin ? 'ShowAdmin' : 'Organizer';

    const judgeHref = ROLE_WORKSPACES.Judge?.href;
    if (judgeHref && (pathname === judgeHref || pathname.startsWith(`${judgeHref}/`))) {
      return railRoleCookie === 'Scribe' ? 'Scribe' : 'Judge';
    }

    const uniqueMatch = ROLE_RAIL_ORDER.find((r) => {
      if (r === 'Organizer' || r === 'ShowAdmin' || r === 'Judge' || r === 'Scribe') return false;
      const w = workspaceFor(r);
      return w ? pathname === w.href || pathname.startsWith(`${w.href}/`) : false;
    });
    return uniqueMatch ?? profile.platform_role ?? 'SuperAdmin';
  })();

  const activeWorkspace = workspaceFor(activeRailRole) ?? workspace;

  const baseNavItems = ROLE_NAV[activeRailRole] ?? ORGANIZER_NAV;

  // Mirrors applyRoleVisibility's billingNav.classList.toggle('hidden-role',
  // moneyHidden()) — the one nav destination the legacy preview actually
  // hid, rather than a blanket re-filter of the whole shared nav.
  const navItems = previewingAsShowAdmin
    ? baseNavItems.filter((item) => item.key !== 'billing')
    : baseNavItems;

  // Exactly one nav item is active at a time. An exact href match wins
  // outright — needed for roles (Judge/Scribe) that nest sibling routes
  // under their landing tab's own path (`/dashboard/judging` vs.
  // `/dashboard/judging/documents`). Otherwise the item with the longest
  // href that's still a path-prefix of the route wins: Dashboard's href
  // (`/dashboard`) is itself a prefix of every other item's href, so on a
  // dynamic route like `/dashboard/shows/[showId]` (no item's href equals
  // it exactly) a plain independent startsWith check per item would light
  // up Dashboard *and* Show Manager together — picking the longest match
  // keeps it to Show Manager alone.
  const activeNavItem =
    navItems.find((n) => n.href === pathname) ??
    navItems.reduce<(typeof navItems)[number] | null>((best, item) => {
      if (!pathname.startsWith(`${item.href}/`)) return best;
      if (!best || item.href.length > best.href.length) return item;
      return best;
    }, null);

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
          const label =
            target.status === 'pending' ? `${target.title} (not migrated)` : target.title;

          // Non-SuperAdmin sees only their own role, so there is nowhere to
          // navigate — render it as a static indicator rather than a dead link.
          if (!isSuperAdmin) {
            const active = role === profile.platform_role;
            return (
              <Tip key={role} text={target.title} className="grid place-items-center">
                <span className={cn('dash-rail-btn', active && 'active')} aria-label={target.title}>
                  <RoleIcon role={role} size={20} />
                </span>
              </Tip>
            );
          }

          // Organizer and Show Admin share one href ('/dashboard') — the same
          // distinction the "Viewing as" dropdown makes, not a different route.
          // While impersonating, clicking either rail icon toggles that same
          // preview cookie instead of navigating to an identical URL, so the
          // rail is a real switch here (matching legacy's platform.html rail,
          // where Show Admin was its own reachable tab) rather than two links
          // that both land on the same page with no visible difference.
          if (impersonating && (role === 'Organizer' || role === 'ShowAdmin')) {
            const active = role === activeRailRole;
            return (
              <Tip key={role} text={label} className="grid place-items-center">
                <button
                  type="button"
                  disabled={isPreviewPending}
                  aria-label={label}
                  aria-current={active ? 'page' : undefined}
                  className={cn('dash-rail-btn', active && 'active')}
                  onClick={() => {
                    if (active) return;
                    // The rail is a navigation control — it must always land
                    // on `/dashboard`, unlike the "VIEWING AS" dropdown below,
                    // which passes the current `pathname` because its whole
                    // point is toggling money visibility without leaving the
                    // page you're already on.
                    setPreview(role === 'ShowAdmin' ? 'showadmin' : 'organizer', target.href);
                  }}
                >
                  <RoleIcon role={role} size={20} />
                </button>
              </Tip>
            );
          }

          // Judge and Scribe share one href ('/dashboard/judging') too, for the
          // same reason Organizer/Show Admin do — the click itself is what
          // has to record which of the two was meant, via the same rail-role
          // cookie SuperAdminShell's own rail already uses.
          if (role === 'Judge' || role === 'Scribe') {
            const active = role === activeRailRole;
            return (
              <Tip key={role} text={label} className="grid place-items-center">
                <button
                  type="button"
                  disabled={isPreviewPending}
                  aria-label={label}
                  aria-current={active ? 'page' : undefined}
                  className={cn('dash-rail-btn', active && 'active')}
                  onClick={() => {
                    if (active) return;
                    runPreviewTransition(async () => {
                      await setRailRole(role);
                    });
                  }}
                >
                  <RoleIcon role={role} size={20} />
                </button>
              </Tip>
            );
          }

          const active = role === activeRailRole;
          return (
            <Tip key={role} text={label} className="grid place-items-center">
              <Link
                href={target.href}
                className={cn('dash-rail-btn', active && 'active')}
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
        <div className="dash-side-sub">{activeWorkspace.title.toUpperCase()}</div>

        {/*
          A person can be genuinely staffed on shows across more than one
          organization (see staff/data/mutations.ts's addStaffUser — nothing
          prevents it), but their dashboard otherwise resolves to a single,
          silently-fixed org — see data/org-selection.ts's doc comment for
          why. Only worth rendering once there is an actual choice to make.
        */}
        {memberOrgs.length > 1 && (
          <>
            <div className="dash-side-heading">ORGANIZATION</div>
            <Tip text="Switch between organizations you have access to" className="block w-full">
              <select
                className="dash-select"
                value={selectedOrgId ?? ''}
                disabled={isOrgPending}
                onChange={(e) => {
                  setOrg(e.target.value, pathname);
                }}
                aria-label="Selected organization"
              >
                {memberOrgs.map((org) => (
                  <option key={org.orgId} value={org.orgId}>
                    {org.orgName}
                  </option>
                ))}
              </select>
            </Tip>
          </>
        )}

        {/*
          "Viewing as" existed in the legacy showstaff.html because Organizer and
          Show Admin shared one view, with money hidden for Show Admin. It is only
          meaningful for someone who can actually be both, so it is not rendered
          for a real Show Admin — offering them an "Organizer" option would imply
          they can grant themselves financial visibility, which the permission
          model deliberately withholds. A SuperAdmin impersonating an organizer
          gets it too, same as legacy's moneyHidden() covered both platform
          roles — impersonating already grants everything an Organizer sees.
        */}
        {(profile.platform_role === 'Organizer' || impersonating) && (
          <>
            <div className="dash-side-heading">VIEWING AS</div>
            <Tip
              text="Preview as Organizer (full access) or ShowAdmin (financials hidden)"
              className="block w-full"
            >
              <select
                className="dash-select"
                value={previewingAsShowAdmin ? 'showadmin' : 'organizer'}
                disabled={isPreviewPending}
                onChange={(e) => {
                  const next = e.target.value === 'showadmin' ? 'showadmin' : 'organizer';
                  setPreview(next, pathname);
                }}
                aria-label="Viewing as role"
              >
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
        <nav className="dash-nav" aria-label={`${activeWorkspace.title} navigation`}>
          {navItems.map((item) => {
            const active = item.key === activeNavItem?.key;
            return (
              <Tip key={item.key} text={item.tip} className="block w-full">
                <Link href={item.href} className={cn('dash-nav-item', active && 'active')}>
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
          <span className="dash-topbar-title">{activeWorkspace.title}</span>
          <span className="dash-badge">{activeRailRole}</span>
          <span className="dash-topbar-note">{activeWorkspace.hint}</span>
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
