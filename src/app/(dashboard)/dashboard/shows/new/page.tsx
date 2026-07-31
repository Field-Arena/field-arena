import { redirect } from 'next/navigation';

/**
 * The standalone "New Show" form was replaced by the instant-create
 * "+ New Show" button on /dashboard/shows (see NewShowButton) — a show is
 * now created with one click and Setup is filled in afterward, rather than
 * asking for everything up front.
 *
 * This route stays only to catch a stale bookmark or browser-history entry
 * and send it somewhere real, rather than falling through to the dynamic
 * "/shows/[showId]" segment with "new" as the id — that segment queries
 * Postgres with it directly, which rejects a non-uuid with a raw
 * invalid-input-syntax error instead of a clean not-found.
 */
export default function NewShowRedirectPage() {
  redirect('/dashboard/shows');
}
