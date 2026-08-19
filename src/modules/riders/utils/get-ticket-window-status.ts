import type { TicketWindow } from '@/modules/riders/utils/parse-ticket-window';

export type TicketWindowStatus = 'not_open_yet' | 'closed' | 'open';

/**
 * Whether ticket sales are currently open, relative to `now` (defaulted to
 * the real clock, but injectable — this is what makes the function pure and
 * testable rather than reaching for `Date.now()` itself).
 *
 * Mirrors the two checks legacy's priceCart makes server-side before pricing
 * a cart ("Ticket sales for this show have not opened yet" / "...have
 * closed") — the real enforcement point is wherever checkout prices a cart
 * (Phase C), not this helper; this is the shared read both that check and any
 * UI messaging (Phase A/B) can use instead of duplicating the date math.
 */
export function getTicketWindowStatus(
  window: TicketWindow,
  now: Date = new Date()
): TicketWindowStatus {
  if (window.opensAt && now.getTime() < window.opensAt.getTime()) return 'not_open_yet';
  if (window.closesAt && now.getTime() > window.closesAt.getTime()) return 'closed';
  return 'open';
}
