'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { setShowPublished, advanceRunnerState } from '../data/mutations';

function message(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function useOpenTicketSales() {
  const router = useRouter();

  return useMutation({
    mutationFn: (showId: string) => setShowPublished(showId, true),
    onSuccess: () => {
      toast.success('Ticket sales are open');
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not open ticket sales'));
    },
  });
}

export function useCloseTicketSales() {
  const router = useRouter();

  return useMutation({
    mutationFn: (showId: string) => advanceRunnerState(showId, { ticketClosed: true }),
    onSuccess: () => {
      toast.success('Ticket sales closed');
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not close ticket sales'));
    },
  });
}

export function useApproveSchedule() {
  const router = useRouter();

  return useMutation({
    mutationFn: (showId: string) => advanceRunnerState(showId, { approved: true }),
    onSuccess: () => {
      toast.success('Schedule approved — show is live');
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not approve the schedule'));
    },
  });
}
