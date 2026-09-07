export type WorkspaceStatus = 'migrated' | 'pending';

export interface RoleWorkspace {
  key: string;
  title: string;
  hint: string;
  href: string;
  status: WorkspaceStatus;

  legacyView: string;

  icon?: string;
}

export const ROLE_RAIL_ORDER = [
  'SuperAdmin',
  'Organizer',
  'ShowAdmin',
  'ShowStaff',
  'Judge',
  'Scribe',
  'Announcer',
  'Vendor',
  'Rider',
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
    icon: 'database',
  },
  ShowStaff: {
    key: 'showstaff',
    title: 'Show Operations',
    hint: 'Live board and on-the-ground operations',
    href: '/dashboard/operations',
    status: 'migrated',
    legacyView: 'views/showstaff-ops.html',
    icon: 'briefcase',
  },
  Judge: {
    key: 'judge',
    title: 'Judge Workspace',
    hint: 'Assignments, schedule, panel, documents, and direct launch into ShowManager Scoring',
    href: '/dashboard/judging',
    status: 'migrated',
    legacyView: 'views/judge-scribe.html',
    icon: 'check-square',
  },
  Scribe: {
    key: 'scribe',
    title: 'Scribe Workspace',
    hint: 'Same workspace as Judge, scoped to your recording assignments',
    href: '/dashboard/judging',
    status: 'migrated',
    legacyView: 'views/judge-scribe.html',
    icon: 'flag',
  },
  Announcer: {
    key: 'announcer',
    title: 'Announcer Dashboard',
    hint: 'Ring status, the full running order, live results, and show contacts',
    href: '/dashboard/announcing',
    status: 'migrated',
    legacyView: 'views/announcer.html',
    icon: 'scale',
  },
  Vendor: {
    key: 'vendor',
    title: 'Vendor Dashboard',
    hint: 'Platform-wide identity — bookings across organizers and discover new booth space',
    href: '/dashboard/vendor',
    status: 'migrated',
    legacyView: 'views/vendor.html',
    icon: 'speaker',
  },
};

export const RIDER_WORKSPACE: RoleWorkspace = {
  key: 'rider',
  title: 'Rider Portal',
  hint: 'How riders discover shows, enter classes, and follow results',
  href: '/rider',
  status: 'migrated',
  legacyView: 'views/rider.html',
  icon: 'pencil',
};

export function isPending(role: string | null | undefined): boolean {
  if (!role) return true;
  return ROLE_WORKSPACES[role]?.status !== 'migrated';
}
