export interface TicketWindowSource {
  ticket_open: string | null;
  ticket_close: string | null;

  end_date: string | null;
}

export interface TicketWindow {
  opensAt: Date | null;
  closesAt: Date | null;
}

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
