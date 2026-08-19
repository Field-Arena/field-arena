/**
 * Vendor dashboard route paths. Kept as their own constants (rather than
 * inline string literals scattered across data/mutations.ts's several
 * `revalidatePath` calls and the Stripe return URL) because they all have to
 * agree — mirrors the reasoning riders/constants.ts's own bucket/path
 * constants document. Not added to the shared `ROUTES` object
 * (`@/shared/constants/routes.ts`) since these are vendor-module-only paths,
 * same as riders' own `/rider/shows/*` staying local to that module.
 */
export const VENDOR_DASHBOARD_PATH = '/dashboard/vendor';
export const VENDOR_DISCOVER_PATH = '/dashboard/vendor/discover';
export const VENDOR_DOCUMENTS_PATH = '/dashboard/vendor/documents';

/**
 * The private Supabase Storage bucket vendor booking documents live in —
 * same pattern as riders/constants.ts's HORSE_DOCUMENTS_BUCKET.
 */
export const VENDOR_DOCS_BUCKET = 'vendor-docs';

/** How long a generated read URL for a vendor document stays valid. */
export const VENDOR_DOCUMENT_SIGNED_URL_TTL_SECONDS = 3600;
