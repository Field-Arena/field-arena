/**
 * Route path used inside marketing content (breadcrumbs). The rest of the
 * site's routes are centralised in `@/shared/constants/routes` — this one is
 * marketing-only, so it lives here instead.
 */
export const LEARNING_CENTER_ROUTE = '/learning-center';

/** Separator glyph between breadcrumb segments (guides and legal pages). */
export const BREADCRUMB_SEPARATOR = ' › ';

/**
 * Shown when a demo request fails for a reason other than a duplicate lead
 * (see the `23505` handling in `data/mutations.ts`).
 */
export const DEMO_REQUEST_ERROR_MESSAGE =
  'Something went wrong on our end. Please try again in a moment.';
