/**
 * Where each role lands after signing in, and which legacy view it replaces.
 *
 * Ported from the VIEWS table in the legacy public/platform.html, which was the
 * authoritative role→view map. Titles and hints are carried over verbatim so the
 * migrated workspaces are recognisable to people who used the old app.
 *
 * One deliberate departure. Legacy resolved the post-login destination through
 * PLATFORM_ROLE_TO_VIEW in marketing-home.html, which contained only three
 * entries — SuperAdmin, Organizer and ShowAdmin. Judge, Scribe, Announcer,
 * ShowStaff and Vendor each had a fully built view that login could not reach;
 * signing in as one of them produced "Signed in, but no dashboard is set up for
 * this account yet." Since the views existed, that is an unfinished wiring job
 * rather than a design decision, so every role gets a destination here.
 *
 * `status` records migration progress honestly. Sending a Judge to the Organizer
 * workspace because it happens to exist would be worse than telling them their
 * workspace is not ready — it shows them another role's data and implies a
 * permission set they do not have.
 *
 * Not included: Volunteer. It appears in the legacy README.md and
 * ARCHITECTURE.md role lists, but in no API code, no schema CHECK constraint and
 * no VIEWS entry. It was never implemented.
 */

export type WorkspaceStatus = 'migrated' | 'pending';

export interface RoleWorkspace {
  /** Matches the legacy VIEWS key, so old #hash links remain traceable. */
  key: string;
  title: string;
  hint: string;
  href: string;
  status: WorkspaceStatus;
  /** The legacy file this replaces — the reference when migrating it. */
  legacyView: string;
  /** DashIcon name for the role rail. */
  icon?: string;
}

/**
 * Order roles appear in the rail, from the legacy platform shell's own ordering
 * (README.md: "Super Admin → Organizer → Show Admin → Judge → Scribe →
 * Announcer → Vendor → Rider"). Volunteer is listed there too but was never
 * implemented — see the note at the top of this file.
 */
export const ROLE_RAIL_ORDER = [
  'SuperAdmin',
  'Organizer',
  'ShowAdmin',
  'ShowStaff',
  'Judge',
  'Scribe',
  'Announcer',
  'Vendor',
] as const;

export const ROLE_WORKSPACES: Record<string, RoleWorkspace> = {
  SuperAdmin: {
    key: 'superadmin',
    title: 'SuperAdmin Console',
    hint: 'Manage every organizer, show, and role from one command center',
    href: '/dashboard/superadmin',
    status: 'migrated',
    legacyView: 'views/superadmin.html',
    icon: 'shield',
  },
  Organizer: {
    key: 'org',
    title: 'Organizer Workspace',
    hint: 'The complete organizer view — set up and run shows, manage your team and contacts, and see the full financial picture',
    href: '/dashboard',
    status: 'migrated',
    legacyView: 'views/showstaff.html',
    icon: 'grid',
  },
  ShowAdmin: {
    key: 'showadmin',
    title: 'Show Admin Workspace',
    hint: 'Same workspace as Organizer, scoped to connected shows — money hidden',
    href: '/dashboard',
    status: 'migrated',
    legacyView: 'views/showstaff.html',
    icon: 'briefcase',
  },
  ShowStaff: {
    key: 'showstaff',
    title: 'Show Operations',
    hint: 'Live board and on-the-ground operations',
    href: '/dashboard/operations',
    status: 'pending',
    legacyView: 'views/showstaff-ops.html',
    icon: 'users',
  },
  Judge: {
    key: 'judge',
    title: 'Judge Workspace',
    hint: 'Assignments, schedule, panel, documents, and direct launch into ShowManager Scoring',
    href: '/dashboard/judging',
    status: 'pending',
    legacyView: 'views/judge-scribe.html',
    icon: 'check-square',
  },
  Scribe: {
    key: 'scribe',
    title: 'Scribe Workspace',
    hint: 'Same workspace as Judge, scoped to your recording assignments',
    href: '/dashboard/judging',
    status: 'pending',
    legacyView: 'views/judge-scribe.html',
    icon: 'flag',
  },
  Announcer: {
    key: 'announcer',
    title: 'Announcer Dashboard',
    hint: 'Running order, rider details, live results, and a mark-as-announced checklist',
    href: '/dashboard/announcing',
    status: 'pending',
    legacyView: 'views/announcer.html',
    icon: 'speaker',
  },
  Vendor: {
    key: 'vendor',
    title: 'Vendor Dashboard',
    hint: 'Platform-wide identity — bookings across organizers and discover new booth space',
    href: '/dashboard/vendor',
    status: 'pending',
    legacyView: 'views/vendor.html',
    icon: 'tag',
  },
};

/**
 * Riders are not in the record above because they are not a platform_role at
 * all. They live in public.riders, a separate identity table, and legacy routed
 * them through their own endpoint rather than the staff role map — the same
 * separation this schema preserves.
 */
export const RIDER_WORKSPACE: RoleWorkspace = {
  key: 'rider',
  title: 'Rider Portal',
  hint: 'How riders discover shows, enter classes, and follow results',
  href: '/rider',
  status: 'pending',
  legacyView: 'views/rider.html',
  icon: 'pencil',
};

/** Roles whose workspace is not yet migrated — used by the placeholder screen. */
export function isPending(role: string | null | undefined): boolean {
  if (!role) return true;
  return ROLE_WORKSPACES[role]?.status !== 'migrated';
}
