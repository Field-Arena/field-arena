/**
 * Pure functions only — no imports of runtime code, per
 * .claude/rules/layers.md. (Type-only imports are fine — they're erased.)
 */

/** The `shows` columns a ticket window is parsed from. */
export interface TicketWindowSource {
  ticket_open: string | null;
  ticket_close: string | null;
  /** The show's last day — the hard cap on `closesAt`, see parseTicketWindow. */
  end_date: string | null;
}

export interface TicketWindow {
  opensAt: Date | null;
  closesAt: Date | null;
}

/**
 * Parses a show's ticket-sale window from its raw stored strings.
 *
 * Ported from legacy's parseTicketWindow (api/rider/[resource].js), plus one
 * deliberate departure: legacy's `ticket_close` was the ONLY thing that ever
 * closed sales, so a show with no explicit close date kept selling — and
 * collecting payment — indefinitely after the show itself had already
 * happened, even days later. `closesAt` is now capped at the end of
 * `end_date` (23:59:59 that day) whenever it's earlier than whatever
 * `ticket_close` would otherwise say, so sales always stop once the show is
 * over, whether or not an organizer ever clicked "Close ticket sales". An
 * organizer can still close sales EARLIER than the show's last day by
 * setting `ticket_close` themselves — only closing LATER than `end_date` is
 * what this cap prevents. A show with no `end_date` on file (organizer never
 * set one) falls back to the old, uncapped behavior — there's no date to
 * cap against.
 *
 * `ticket_open` is a bare ISO date ('YYYY-MM-DD'); `ticket_close` is
 * '<ISO date> · <HH:MM>' (24-hour), the time defaulting to end-of-day when
 * omitted; `end_date` is a bare ISO date, same as `ticket_open`.
 */
export function parseTicketWindow(show: TicketWindowSource): TicketWindow {
  const opensAt = show.ticket_open ? new Date(`${show.ticket_open}T00:00:00`) : null;

  let closesAt: Date | null = null;
  if (show.ticket_close) {
    const [datePart, timePart] = show.ticket_close.split(' · ');
    if (datePart) closesAt = new Date(`${datePart}T${timePart ?? '23:59'}:00`);
  }
  if (closesAt && Number.isNaN(closesAt.getTime())) closesAt = null;

  const endOfShow = show.end_date ? new Date(`${show.end_date}T23:59:59`) : null;
  if (endOfShow && !Number.isNaN(endOfShow.getTime())) {
    closesAt = closesAt && closesAt.getTime() < endOfShow.getTime() ? closesAt : endOfShow;
  }

  return {
    opensAt: opensAt && !Number.isNaN(opensAt.getTime()) ? opensAt : null,
    closesAt,
  };
}
