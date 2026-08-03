'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import { createVenue, updateVenue, deleteVenue } from '../data/mutations';
import type { CreateVenueInput, UpdateVenueInput } from '../schemas';

/** Mutation hooks for the Venues page. Every action revalidates server-side; router.refresh() pulls the re-rendered list back into this view. */

export function useCreateVenue(options?: { onSuccess?: () => void }) {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: CreateVenueInput) => createVenue(input),
    onSuccess: () => {
      toast.success('Venue added');
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not add this venue'));
    },
  });
}

export function useUpdateVenue(options?: { onSuccess?: () => void }) {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: UpdateVenueInput) => updateVenue(input),
    onSuccess: () => {
      toast.success('Venue saved');
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not save this venue'));
    },
  });
}

export function useDeleteVenue(options?: { onSuccess?: () => void }) {
  const router = useRouter();

  return useMutation({
    mutationFn: (id: string) => deleteVenue({ id }),
    onSuccess: () => {
      toast.success('Venue deleted');
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not delete this venue'));
    },
  });
}
