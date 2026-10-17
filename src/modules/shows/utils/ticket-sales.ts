import type { TicketSales } from '@/modules/shows/types';

/* Ticket dates are stored as 'YYYY-MM-DD · HH:MM' (Show Manager's format). */
function parseTicketDate(value: string | null): number | null {
  if (!value) return null;
  const match = /^(\d{4}-\d{2}-\d{2})\s*·\s*(\d{2}:\d{2})$/.exec(value.trim());
  if (!match) return null;
  const time = new Date(`${match[1] ?? ''}T${match[2] ?? ''}:00`).getTime();
  return Number.isNaN(time) ? null : time;
}

const daysUntil = (at: number, now: number) => Math.max(0, Math.ceil((at - now) / 86_400_000));

/* Whether riders can buy right now, and how many days are left (or until
 * sales open). Sales are open once the show is published, the opening time
 * (if any) has passed, the closing time hasn't, and the organizer hasn't
 * closed them by hand in the show runner. */
export function ticketSalesStatus(
  show: {
    published: boolean;
    ticketOpen: string | null;
    ticketClose: string | null;
    manuallyClosed: boolean;
  },
  now: number = Date.now(),
): TicketSales {
  const openAt = parseTicketDate(show.ticketOpen);
  const closeAt = parseTicketDate(show.ticketClose);

  if (show.manuallyClosed || (closeAt !== null && closeAt <= now)) {
    return { state: 'closed', days: null };
  }
  if (!show.published || (openAt !== null && openAt > now)) {
    return { state: 'not-open', days: openAt !== null ? daysUntil(openAt, now) : null };
  }
  return { state: 'open', days: closeAt !== null ? daysUntil(closeAt, now) : null };
}
