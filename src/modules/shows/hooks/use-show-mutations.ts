'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  createShow,
  createClass,
  createDivision,
  createAddOn,
  setShowPublished,
} from '../data/mutations';
import type {
  CreateShowInput,
  CreateClassInput,
  CreateDivisionInput,
  CreateAddOnInput,
} from '../schemas';

function message(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function useCreateShow() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: CreateShowInput) => createShow(input),
    onSuccess: ({ id }) => {
      toast.success('Show created. Add classes and divisions next.');
      // Land on the new show rather than whichever one was focused before.
      router.push(`/dashboard/shows?show=${id}`);
    },
    onError: (error) => {
      toast.error(message(error, 'Could not create the show'));
    },
  });
}

export function useCreateClass(options?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: (input: CreateClassInput) => createClass(input),
    onSuccess: () => {
      toast.success('Class added');
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not add the class'));
    },
  });
}

export function useCreateDivision(options?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: (input: CreateDivisionInput) => createDivision(input),
    onSuccess: () => {
      toast.success('Division added');
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not add the division'));
    },
  });
}

export function useCreateAddOn(options?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: (input: CreateAddOnInput) => createAddOn(input),
    onSuccess: () => {
      toast.success('Add-on created');
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not create the add-on'));
    },
  });
}

export function useSetShowPublished() {
  const router = useRouter();

  return useMutation({
    mutationFn: ({ showId, published }: { showId: string; published: boolean }) =>
      setShowPublished(showId, published),
    onSuccess: (_data, { published }) => {
      toast.success(
        published
          ? 'Show published — riders can now see and enter it'
          : 'Show unpublished — it is hidden from riders again'
      );
      router.refresh();
    },
    onError: (error) => {
      // Carries the waiver-approval reason through verbatim, since that is the
      // actionable part.
      toast.error(message(error, 'Could not change publish state'));
    },
  });
}
