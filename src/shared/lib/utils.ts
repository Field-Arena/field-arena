import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Whether a route param looks like a real uuid, before it ever reaches a
 * `.eq('id', value)` query. Postgres rejects a non-uuid string for a uuid
 * column with a raw "invalid input syntax" error rather than just finding no
 * row, so a page must rule this out itself to render its own not-found state
 * instead of an uncaught 500 — the failure mode a stale link to a route that
 * used to be static (e.g. an old "/shows/new" bookmark, now shadowed by a
 * "/shows/[showId]" segment) actually hits in production.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
  return UUID_RE.test(value)
}
