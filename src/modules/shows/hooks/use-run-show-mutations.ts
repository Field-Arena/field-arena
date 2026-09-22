'use client';

import { setShowPublished, advanceRunnerState } from '@/modules/shows/data/mutations';
import { useRefreshingMutation } from '@/shared/hooks/use-refreshing-mutation';

export function useOpenTicketSales() {
  return useRefreshingMutation((showId: string) => setShowPublished(showId, true), {
    successMessage: 'Ticket sales are open',
    errorFallback: 'Could not open ticket sales',
  });
}

export function useCloseTicketSales() {
  return useRefreshingMutation(
    (showId: string) => advanceRunnerState(showId, { ticketClosed: true }),
    {
      successMessage: 'Ticket sales closed',
      errorFallback: 'Could not close ticket sales',
    },
  );
}

export function useApproveSchedule() {
  return useRefreshingMutation((showId: string) => advanceRunnerState(showId, { approved: true }), {
    successMessage: 'Schedule approved — show is live',
    errorFallback: 'Could not approve the schedule',
  });
}
