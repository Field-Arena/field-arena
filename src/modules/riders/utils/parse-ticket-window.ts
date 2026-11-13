import { splitTicketClose } from '@/shared/lib/format/ticket-close';
import { resolveTimeZone, zonedDateTimeToUtc } from '@/shared/lib/format/time-zone';

export interface TicketWindowSource {
  ticket_open: string | null;
  ticket_close: string | null;

  end_date: string | null;
  // The organizer typed these dates/times in the show's local zone; without
  // it they'd be read in the server's zone (UTC on Vercel).
  timezone?: string | null;
  org_timezone?: string | null;
}

export interface TicketWindow {
  opensAt: Date | null;
  closesAt: Date | null;
}

export function parseTicketWindow(show: TicketWindowSource): TicketWindow {
  const tz = resolveTimeZone(show.timezone, show.org_timezone);
  const opensAt = show.ticket_open ? zonedDateTimeToUtc(show.ticket_open, '00:00', tz) : null;

  let closesAt: Date | null = null;
  if (show.ticket_close) {
    const { date, time } = splitTicketClose(show.ticket_close);
    if (date) closesAt = zonedDateTimeToUtc(date, time || '23:59', tz);
  }

  const endOfShow = show.end_date ? zonedDateTimeToUtc(show.end_date, '23:59:59', tz) : null;
  if (endOfShow) {
    closesAt = closesAt && closesAt.getTime() < endOfShow.getTime() ? closesAt : endOfShow;
  }

  return { opensAt, closesAt };
}
