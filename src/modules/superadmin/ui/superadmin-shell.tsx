'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOutIcon } from 'lucide-react';
import { SUPERADMIN_NAV } from '../constants';
import { OrganizerSearch } from './organizer-search';
import { useSignOut } from '@/modules/auth/hooks/use-auth-mutations';
import type { StaffProfile } from '@/modules/auth/data/queries';
import { RoleRail } from '@/shared/ui/role-rail';
import { cn } from '@/shared/lib/utils';

/**
 * The SuperAdmin console shell, matching the legacy console's layout: the dark
 * role rail down the left, a title bar, then a wrapping row of category buttons
 * over full-width content (public/views/superadmin.html lines 380-400, rendered
 * inside platform.html which supplied the rail).
 *
 * Its own shell rather than a reuse of the organizer one, because the two are
 * genuinely different shapes — this is platform-wide sections over wide tables,
 * the organizer workspace is a per-show sidebar.
 */
export function SuperAdminShell({
  children,
  profile,
}: {
  children: ReactNode;
  profile: StaffProfile;
}) {
  const pathname = usePathname();
  const { mutate: signOut, isPending: isSigningOut } = useSignOut();
  const isOrganizerList = pathname === '/dashboard/superadmin';

  return (
    <div className="flex min-h-screen bg-cream">
      <RoleRail currentRole={profile.platform_role} />

      <div className="min-w-0 flex-1">
        <header className="border-b border-border bg-white">
          <div className="flex flex-wrap items-center gap-3 px-6 py-3">
            <span className="font-serif text-[19px] font-bold text-hunter-deep">
              SuperAdmin Console
            </span>
            <span className="rounded-full bg-hunter-pale px-3 py-1 text-xs font-bold text-hunter">
              {profile.platform_role}
            </span>
            <span className="text-fa-muted ml-auto hidden text-[13px] lg:inline">
              Manage every organizer, show, and role from one command center
            </span>
          </div>

          <nav
            aria-label="Console sections"
            className="flex flex-wrap items-center gap-2 border-t border-border px-6 py-2.5"
          >
            {SUPERADMIN_NAV.map((item) => {
              const active =
                item.href === '/dashboard/superadmin'
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  title={item.hint}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-[13px] font-bold no-underline transition',
                    active
                      ? 'border-hunter-deep bg-hunter-deep text-white'
                      : item.accent
                        ? 'border-gold bg-gold-pale text-hunter-deep hover:border-gold-dark'
                        : 'border-border bg-white text-hunter-deep hover:border-hunter-soft'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}

            <div className="text-fa-muted ml-auto flex items-center gap-2.5 text-[13px]">
              <span className="hidden sm:inline">{profile.name}</span>
              <button
                type="button"
                onClick={() => {
                  signOut();
                }}
                disabled={isSigningOut}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-semibold text-hunter-deep transition hover:bg-cream disabled:opacity-50"
              >
                <LogOutIcon className="size-3.5" aria-hidden />
                {isSigningOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </nav>

          {/*
            Second action row, matching the legacy console. The organizer search
            only makes sense on the organizer list, so it is scoped to that route.

            The three buttons are rendered but inert and say why on hover. Adding
            an organizer needs a form and an invite email; resending invites needs
            the email provider wired; the Demo and Signup Flow Preview buttons
            opened static walkthrough pages (preview-rider-demo.html,
            preview-signup-pages.html) of screens that are becoming real routes
            here, so re-creating them as separate previews would mean maintaining a
            second copy of every signup screen.
          */}
          <div className="flex flex-wrap items-center gap-2 border-t border-border px-6 py-2.5">
            {isOrganizerList && <OrganizerSearch />}

            <button
              type="button"
              disabled
              title="Adding an organizer needs the onboarding form and invite email"
              className="rounded-lg border border-hunter-deep bg-hunter-deep px-3 py-1.5 text-[13px] font-bold text-white opacity-45"
            >
              + Add Organizer
            </button>
            <button
              type="button"
              disabled
              title="Sending invite emails needs the email provider wired"
              className="rounded-lg border border-border bg-white px-3 py-1.5 text-[13px] font-bold text-hunter-deep opacity-45"
            >
              Resend Invite (All Pending)
            </button>
            <button
              type="button"
              disabled
              title="The legacy Demo and Signup Flow Preview pages were static walkthroughs; those screens are becoming real routes here"
              className="rounded-lg border border-border bg-white px-3 py-1.5 text-[13px] font-bold text-hunter-deep opacity-45"
            >
              Signup Flow Preview
            </button>
          </div>

          {/* The legacy console kept a breadcrumb under the button bar. */}
          <div className="px-6 pb-2 text-[13px] font-bold text-hunter-deep">Super Admin</div>
        </header>

        <main className="px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
