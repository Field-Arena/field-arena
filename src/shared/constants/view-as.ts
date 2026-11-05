// Cookies behind the SuperAdmin "view as" flows: impersonating an organizer,
// switching the role rail, and previewing a real show in a per-show role.
// Written by the superadmin module's session mutations, read server-side by
// `@/shared/lib/auth/view-as`.

export const IMPERSONATION_COOKIE = 'fa_impersonate_org';

export const RAIL_ROLE_COOKIE = 'fa_rail_role';

export const PENDING_PREVIEW_COOKIE = 'fa_pending_preview';

export const PREVIEW_ROLE_COOKIE = 'fa_preview_role';

export const PREVIEW_SHOW_COOKIE = 'fa_preview_show';

export const VIEW_AS_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 8;
