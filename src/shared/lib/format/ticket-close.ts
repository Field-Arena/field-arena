// shows.ticket_close has been stored in more than one shape over time:
//   legacy  "YYYY-MM-DD · HH:MM"
//   current "YYYY-MM-DD HH:MM"   (updateTicketWindow)
//   ISO     "YYYY-MM-DDTHH:MM[:SS]"
//   date    "YYYY-MM-DD"         (no time set)
// Every reader goes through this so a format change can't silently drop the
// time again.
const TICKET_CLOSE_RE = /^(\d{4}-\d{2}-\d{2})(?:\s*·\s*|\s+|T)?(\d{2}:\d{2})?(?::\d{2}(?:\.\d+)?)?/;

export function splitTicketClose(value: string | null | undefined): {
  date: string;
  time: string;
} {
  const match = TICKET_CLOSE_RE.exec((value ?? '').trim());
  if (!match) return { date: '', time: '' };
  return { date: match[1] ?? '', time: match[2] ?? '' };
}
