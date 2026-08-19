import type { TicketWindow } from '@/modules/riders/utils/parse-ticket-window';

export type TicketWindowStatus = 'not_open_yet' | 'closed' | 'open';

export function getTicketWindowStatus(
  window: TicketWindow,
  now: Date = new Date(),
): TicketWindowStatus {
  if (window.opensAt && now.getTime() < window.opensAt.getTime()) return 'not_open_yet';
  if (window.closesAt && now.getTime() > window.closesAt.getTime()) return 'closed';
  return 'open';
}
